const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Route: /rusername/webhook?url=<webhook_url>
app.get("/rusername/webhook", async (req, res) => {
    const webhookUrl = req.query.url;

    if (!webhookUrl) {
        return res.status(400).json({ error: "Webhook URL is required" });
    }

    try {
        // Generate a random 5-character username (alphanumeric)
        const username = Array(5)
            .fill(null)
            .map(() => Math.random().toString(36)[2])
            .join("");

        // Check Roblox API for username availability
        const response = await axios.get(`https://users.roblox.com/v1/usernames/validate`, {
            params: {
                request: username,
                context: "Signup"
            },
        });

        const isAvailable = response.data.code === 0; // 0 means available

        if (isAvailable) {
            // Send username and message to webhook if available
            const payload = {
                username,
                message: `${username} is available!`,
            };

            await axios.post(webhookUrl, payload);

            return res.status(200).json({ success: true, ...payload });
        } else {
            return res.status(200).json({ 
                success: false, 
                username, 
                message: `${username} is taken.` 
            });
        }
    } catch (error) {
        console.error("Error checking username:", error.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
