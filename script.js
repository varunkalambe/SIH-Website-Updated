document.addEventListener("DOMContentLoaded", () => {
    const uploadZone = document.getElementById("uploadZone");
    const fileInput = document.getElementById("fileInput");
    const progressBar = document.getElementById("progressBar");
    const progressFill = document.getElementById("progressFill");
    const fileInfo = document.getElementById("fileInfo");
    const fileName = document.getElementById("fileName");
    const fileSize = document.getElementById("fileSize");
    const languageSelector = document.getElementById("languageSelector");
    const fromLang = document.getElementById("fromLang");
    const toLang = document.getElementById("toLang");
    const translateBtn = document.getElementById("translateBtn");
    const notification = document.getElementById("notification");
    const notificationText = document.getElementById("notificationText");

    let selectedFile = null;

    // Drag & Drop
    uploadZone.addEventListener("click", () => fileInput.click());
    uploadZone.addEventListener("dragover", (e) => { e.preventDefault(); uploadZone.classList.add("dragover"); });
    uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
    uploadZone.addEventListener("drop", (e) => { 
        e.preventDefault(); 
        uploadZone.classList.remove("dragover"); 
        if(e.dataTransfer.files.length>0) handleFileSelect(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener("change", (e) => { if(e.target.files.length>0) handleFileSelect(e.target.files[0]); });

    function handleFileSelect(file) {
        const allowedTypes = ["video/mp4","video/avi","video/quicktime","video/x-ms-wmv"];
        if(!allowedTypes.includes(file.type)){ showNotification("❌ Invalid video type"); return; }
        const maxSize = 100*1024*1024;
        if(file.size>maxSize){ showNotification("❌ File exceeds 100MB"); return; }

        selectedFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = (file.size/1024/1024).toFixed(2) + " MB";
        fileInfo.style.display = "block";
        progressBar.style.display = "block";
        simulateUploadProgress();
    }

    function simulateUploadProgress(){
        progressFill.style.width="0%";
        let progress=0;
        const interval = setInterval(()=>{
            progress+=Math.random()*15;
            if(progress>100) progress=100;
            progressFill.style.width = progress + "%";
            if(progress>=100){
                clearInterval(interval);
                languageSelector.style.display="block";
                translateBtn.classList.add("active");
                showNotification("✅ File ready! Select languages and click Translate.");
            }
        }, 300);
    }

    translateBtn.addEventListener("click", async ()=>{
        if(!translateBtn.classList.contains("active")) return;
        if(!selectedFile){ showNotification("❌ No file selected!"); return; }

        const formData = new FormData();
        formData.append("video", selectedFile);
        formData.append("fromLang", fromLang.value);
        formData.append("toLang", toLang.value);

        showNotification("🚀 Uploading video...");

        try{
            const response = await fetch("http://localhost:5000/api/upload", { method:"POST", body:formData });
            const data = await response.json();

            if(response.ok){
                showNotification(`✅ Upload complete! Download: ${data.downloadUrl}`);
            }else{
                showNotification(`❌ Error: ${data.error || "Unknown error"}`);
            }
        }catch(err){
            console.error(err);
            showNotification(`❌ Network/server error: ${err.message}`);
        }
    });

    function showNotification(message){
        notificationText.textContent = message;
        notification.classList.add("show");
        setTimeout(()=> notification.classList.remove("show"),4000);
    }
});
