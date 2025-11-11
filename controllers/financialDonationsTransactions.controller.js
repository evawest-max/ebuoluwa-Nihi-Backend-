import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();
// import Payment from "../models/payment.model.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import paymentz from "../models/financialDonationsTransactions.model.js";

export const initializeFinancialDonationPayment = async (req, res) => {
  try {
    const { amount, user, } = req.body;
    console.log(req.body)

    if (!amount || !user)
      return res.status(400).json({ message: "Missing required fields" });

    const reference = crypto.randomBytes(8).toString("hex");

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email:user.email,
        amount: amount * 100, // amount in kobo
        reference,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Save payment
    await paymentz.create({
      userId: user.id,
      email: user.email,
      name: user.name,
      amount,
      reference,
      status: "pending",
    });

    res.status(200).json({
      message: "Payment initialized",
      authorizationUrl: response.data.data.authorization_url,
      reference,
    });
  } catch (error) {
    console.error("❌ Initialize Payment Error:", error.message);
    res.status(500).json({ message: "Error initializing payment" });
  }
};

export const verifyFinancialDonationPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    // Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = response.data.status;
    if (!paystackData) {
      return res.status(400).json({ message: "Invalid Paystack response" });
    }

    // Find payment record in your database
    let payment = await paymentz.findOne({ reference });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // Update status based on Paystack response
    if (paystackData == true) {
      payment.status = "success";
      payment.paidAt = paystackData.paid_at || new Date();
      await payment.save();

      // Send success email
      await sendEmail({
        to: payment.email,
        subject: "Payment Confirmation – Thank You for Your Donation",
        html: `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #2c3e50;">Payment Confirmation</h2>
      <p>Dear Supporter,</p>
      <p>We are pleased to inform you that your payment of 
        <strong>₦${(payment.amount / 100).toLocaleString()}</strong> has been successfully processed.</p>
      <p>Thank you sincerely for your generous donation to our charity. 
        Your contribution will make a meaningful difference and help us continue supporting those in need.</p>
      <p><strong>Reference:</strong> ${payment.reference}</p>
      <br/>
      <p>We deeply appreciate your support and commitment to our mission.</p>
      <p>Warm regards,<br/>The NIHI Team</p>
    </div>
  `,
      });

      return res.status(200).json({ message: "Payment verified successfully" });
    } else {
      payment.status = "failed";
      await payment.save();
      return res.status(400).json({ message: "Payment failed" });
    }
  } catch (error) {
    console.error("❌ Verify Payment Error:", error.message);
    res.status(500).json({ message: "Error verifying payment" });
  }
};

export const paystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const signature = req.headers["x-paystack-signature"];
    const hash = crypto
      .createHmac("sha512", secret)
      .update(req.body)
      .digest("hex");

    if (hash !== signature) return res.status(401).send("Invalid signature");

    const event = JSON.parse(req.body);

    if (event.event === "charge.success") {
      const data = event.data;

      const payment = await paymentz.findOne({ reference: data.reference });
      if (payment) {
        payment.status = "success";
        await payment.save();

        await sendEmail({
          to: payment.email,
          subject: "Payment Successful 🎉",
          html: `<p>Your payment of ₦${payment.amount} was confirmed by Paystack.</p>`,
        });
      }
    }

    res.status(200).send("Webhook received");
  } catch (error) {
    console.error("❌ Webhook Error:", error.message);
    res.status(500).send("Server error");
  }
};
