
const PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3MzY1ZjFkMi0wOTkzLTRkZDktYmI5MC0zYjY1MmI2NmFlMzQiLCJlbWFpbCI6ImpvZXl3aW40MkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJGUkExIn0seyJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MSwiaWQiOiJOWUMxIn1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlLCJzdGF0dXMiOiJBQ1RJVkUifSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiZTMxMWZkYjM2NDhhZmQzNzNiNjIiLCJzY29wZWRLZXlTZWNyZXQiOiJjNmY3MjJhM2JkNTUxOTViNjIyZDFmMTNkZmMwMWYwMTJlY2Q4NWM2NTM3ODgxMjViNzMzZGNiZTdlNTkxMjBiIiwiZXhwIjoxNzcwNjEwMDM0fQ.gFhwztGc-VRZRTJdO-0bbPL6meGous5mSVpwVO6UKmY"; // Replace with your actual Pinata JWT token

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("uploadBtn").addEventListener("click", uploadToPinata);
    displayPosts();
});

const posts = JSON.parse(localStorage.getItem("posts") || "[]");


//upload plus button
async function uploadToPinata() {
    console.log("Upload button clicked!"); // Debugging

    const imageInput = document.getElementById("imageInput");
    const textInput = document.getElementById("textInput");

    if (!imageInput || !textInput) {
        console.error("Input elements not found!");
        return;
    }

    const imageFile = imageInput.files[0];
    const text = textInput.value.trim();

    if (!imageFile) {
        alert("Please select an image!");
        return;
    }

    if (!text) {
        alert("Please enter some text!");
        return;
    }

    const formData = new FormData();
    formData.append("file", imageFile);

    try {
        console.log("Uploading the form");

        const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: { Authorization: `Bearer ${PINATA_JWT}` },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Pinata upload failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Upload successful:", data);

        if (data.IpfsHash) {
            const newPost = { text, cid: data.IpfsHash };
            posts.push(newPost);
            localStorage.setItem("posts", JSON.stringify(posts));
            displayPosts();
        }
    } catch (error) {
        console.error("Error uploading to Pinata:", error);
        alert("Error uploading image. Check console for details.");
    }
}

function displayPosts() {
    console.log("Displaying posts...");

    const postsContainer = document.getElementById("posts");
    if (!postsContainer) {
        console.error("Posts container not found!");
        return;
    }

    postsContainer.innerHTML = "";

    posts.forEach((post) => {
        const div = document.createElement("div");
        div.className = "post";
        div.innerHTML = `
                        <img src="https://gateway.pinata.cloud/ipfs/${post.cid}" alt="rip image"> 
                        <p>${post.text}</p>`;
        postsContainer.appendChild(div);
    });
}
