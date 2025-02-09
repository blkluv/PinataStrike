
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3MzY1ZjFkMi0wOTkzLTRkZDktYmI5MC0zYjY1MmI2NmFlMzQiLCJlbWFpbCI6ImpvZXl3aW40MkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZTMxMWZkYjM2NDhhZmQzNzNiNjIiLCJzY29wZWRLZXlTZWNyZXQiOiJjNmY3MjJhM2JkNTUxOTViNjIyZDFmMTNkZmMwMWYwMTJlY2Q4NWM2NTM3ODgxMjViNzMzZGNiZTdlNTkxMjBiIiwiZXhwIjoxNzcwNjEwMDM0fQ.gFhwztGc-VRZRTJdO-0bbPL6meGous5mSVpwVO6UKmY"; // Replace with your actual Pinata JWT token


document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("uploadBtn").addEventListener("click", uploadToPinata);
    displayPosts();
});

const groupName = "messageJSONs"; // Define the group name

const posts = JSON.parse(localStorage.getItem("posts") || "[]");

// Make array and fetch data from Pinata
async function update() {
    console.log("Running files...");
    try {
        const url = "https://api.pinata.cloud/data/pinList?status=pinned";
        const request = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`,
            }
        });

        const jsonPost = await request.json();
        console.log(jsonPost);

        // Filter rows where metadata.name is "post"
        const jsonFiltered = jsonPost.rows.filter(row => row.metadata.name === "post");
        console.log(jsonFiltered);

        return jsonFiltered;
    } catch (error) {
        console.log(error);
    }
}

// Upload button to Pinata
async function uploadToPinata() {
    console.log("Upload button clicked!");

    const imageInput = document.getElementById("imageInput");
    const textInput = document.getElementById("textInput");

    if (!imageInput || !textInput) {
        console.error("Input elements not found!");
        return;
    }

    const imageFile = imageInput.files[0];
    const text = textInput.value.trim();

    if (!text) {
        alert("Please enter some text!");
        return;
    }

    const formData = new FormData();
    if (imageFile) {
        formData.append("file", imageFile);  // Only append image if it's provided
    }

    try {
        let imageCid = null;
        if (imageFile) {
            console.log("Uploading image to Pinata...");
            // Upload the image to Pinata if it exists
            const imageResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                method: "POST",
                headers: { Authorization: `Bearer ${PINATA_JWT}` },
                body: formData
            });

            if (!imageResponse.ok) {
                throw new Error(`Pinata image upload failed: ${imageResponse.statusText}`);
            }

            const imageData = await imageResponse.json();
            console.log("Image uploaded:", imageData);

            imageCid = imageData.IpfsHash;  // Store the CID if image was uploaded
        }

        // Create post object, either with or without image
        const postObject = { text: text };
        if (imageCid) {
            postObject.imageCID = imageCid;  // Only include imageCID if there was an image
        }

        // Pin the JSON data with the post information
        const jsonResponse = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${PINATA_JWT}`
            },
            body: JSON.stringify({
                pinataMetadata: {
                    name: "post", // Set the name for the metadata
                },
                pinataContent: postObject // The actual content to be pinned
            })
        });

        if (!jsonResponse.ok) {
            throw new Error(`Pinata JSON upload failed: ${jsonResponse.statusText}`);
        }

        const jsonData = await jsonResponse.json();
        console.log("Post JSON uploaded:", jsonData);

        // Store only the JSON CID for retrieval later
        const jsonCID = jsonData.IpfsHash;
        posts.push(jsonCID);

        displayPosts(); // Re-display the posts after adding the new one
    } catch (error) {
        console.error("Error uploading to Pinata:", error);
        alert("Error uploading image. Check console for details.");
    }
}

// Display posts in descending order (oldest to newest)
async function displayPosts() {
    console.log("Displaying posts...");

    const postsContainer = document.getElementById("posts");
    if (!postsContainer) {
        console.error("Posts container not found!");
        return;
    }

    // Await update to ensure you have the data
    const jsonfiltered = await update(); // Wait for the data before proceeding

    // Sort posts by the `date_pinned` field in descending order (oldest to newest)
    const sortedPosts = jsonfiltered.sort((a, b) => {
        return new Date(a.date_pinned) - new Date(b.date_pinned); // Descending order
    });
    

    postsContainer.innerHTML = ""; // Clear existing content

    // Loop through the sorted posts and display them
    for (const jsonCID of sortedPosts) {
        try {
            // Fetch the post JSON from Pinata
            const response = await fetch(`https://gateway.pinata.cloud/ipfs/${jsonCID.ipfs_pin_hash}`);
            if (!response.ok) throw new Error("Failed to fetch post data");

            const post = await response.json();

            // Create and display the post div
            const div = document.createElement("div");
            div.className = "post";
            div.innerHTML = `
                ${post.imageCID ? `<img src="https://gateway.pinata.cloud/ipfs/${post.imageCID}" alt="Uploaded Image">` : ''}
                <p>${jsonCID.date_pinned}
                <br><br>${post.text}</p>
                
            `;
            postsContainer.appendChild(div);
        } catch (error) {
            console.error("Error loading post:", error);
        }
    }
}
