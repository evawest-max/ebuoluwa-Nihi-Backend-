import FormData from "form-data";
import axios from "axios";

export const uploadToPinata = async (file) => {
  const formData = new FormData();
  formData.append("file", file.buffer, {
    filename: file.originalname,
    contentType: file.mimetype,
  });

  const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
    headers: {
      "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
      pinata_api_key: process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_API_SECRET,
    },
  });

  return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
};
