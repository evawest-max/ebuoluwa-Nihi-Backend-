import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import Paymentz from "../models/Payment.model.js";

export const initializePayment = async (req, res) => {
  try {
    const { amount, email, user, items} = req.body;
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
    await Paymentz.create({
      userId: user.id,
      email,
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

export const verifyPayment = async (req, res) => {
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
    let payment = await Paymentz.findOne({ reference });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // Update status based on Paystack response
    //  if (paystackData.status === "success") {
    if (paystackData==true) {
      payment.status = "success";
      payment.paidAt = paystackData.paid_at || new Date();
      await payment.save();

      // Send success email
      await sendEmail({
        to: payment.email,
        subject: "🎉 Payment Successful",
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Payment Confirmation</h2>
            <p>Hi,</p>
            <p>Your payment of <strong>₦${(payment.amount / 100).toLocaleString()}</strong> was successful!</p>
            <p>Reference: <strong>${payment.reference}</strong></p>
            <br/>
            <p>Thank you for your payment.</p>
            <p>— The NIHI Team</p>
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

      const payment = await Paymentz.findOne({ reference: data.reference });
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
