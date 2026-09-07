chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (
            message.type !==
            "JUMP_TO_TIMESTAMP"
        ) {
            return;
        }

        const tabId = Number(message.tabId);
        const seconds = Number(message.seconds);

        console.log(
            "========== BACKGROUND =========="
        );

        console.log(
            "Tab ID:",
            tabId
        );

        console.log(
            "Seconds:",
            seconds
        );

        if (!tabId) {
            sendResponse({
                success: false,
                error: "Invalid YouTube tab ID"
            });

            return;
        }

        chrome.tabs.get(tabId)
            .then(tab => {

                console.log(
                    "Target tab:",
                    tab.id,
                    tab.url
                );

                // Make sure target is YouTube
                if (
                    !tab.url ||
                    (
                        !tab.url.startsWith(
                            "https://www.youtube.com/"
                        ) &&
                        !tab.url.startsWith(
                            "https://youtu.be/"
                        )
                    )
                ) {
                    throw new Error(
                        "Target tab is not YouTube"
                    );
                }

                /*
                 * Execute inside the EXISTING
                 * YouTube tab.
                 */
                return chrome.scripting.executeScript({
                    target: {
                        tabId: tabId
                    },

                    func: (timestamp) => {

                        console.log(
                            "VideoMind: searching for video..."
                        );

                        const video =
                            document.querySelector(
                                "video"
                            );

                        if (!video) {
                            throw new Error(
                                "YouTube video element not found"
                            );
                        }

                        console.log(
                            "VideoMind: seeking to",
                            timestamp
                        );

                        video.currentTime =
                            timestamp;

                        video.play().catch(() => { });

                    },

                    args: [seconds]
                });

            })

            .then(() => {

                /*
                 * Activate the EXISTING YouTube tab.
                 *
                 * IMPORTANT:
                 * This does NOT create a tab.
                 */
                return chrome.tabs.update(
                    tabId,
                    {
                        active: true
                    }
                );

            })

            .then(() => {

                console.log(
                    "✅ YouTube tab activated"
                );

                sendResponse({
                    success: true
                });

            })

            .catch(error => {

                console.error(
                    "❌ Background error:",
                    error
                );

                sendResponse({
                    success: false,
                    error: error.message
                });

            });

        // Keep message channel open
        return true;
    }
);