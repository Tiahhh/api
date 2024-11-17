const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

// Store active intervals
const activeIntervals = new Map();

// Route: /rusername/webhook?url=<webhook_url>
app.get("/rusername/webhook", (req, res) => {
    const webhookUrl = req.query.url;

    if (!webhookUrl) {
        return res.status(400).json({ error: "Webhook URL is required" });
    }

    // Check if an interval is already running for this webhook
    if (activeIntervals.has(webhookUrl)) {
        return res.status(400).json({ error: "Webhook already active for this URL." });
    }

    // Start checking every 10 seconds
    const intervalId = setInterval(async () => {
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
                    context: "Signup",
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
                console.log(`Sent to webhook: ${JSON.stringify(payload)}`);
            } else {
                console.log(`${username} is taken.`);
            }
        } catch (error) {
            console.error("Error checking username:", error.message);
        }
    }, 10000); // 10 seconds

    // Store interval ID for this webhook
    activeIntervals.set(webhookUrl, intervalId);

    res.status(200).json({ success: true, message: "Started checking usernames every 10 seconds." });
});

// Route to stop checking
app.get("/rusername/stop", (req, res) => {
    const webhookUrl = req.query.url;

    if (!webhookUrl) {
        return res.status(400).json({ error: "Webhook URL is required to stop." });
    }

    const intervalId = activeIntervals.get(webhookUrl);

    if (intervalId) {
        clearInterval(intervalId);
        activeIntervals.delete(webhookUrl);
        return res.status(200).json({ success: true, message: "Stopped checking usernames." });
    }

    return res.status(400).json({ error: "No active checks for this webhook URL." });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
