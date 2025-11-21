const upload_box = document.querySelector(".upload-box");
const upload_box_text = upload_box.querySelector(".upload-text");
const input_element = document.querySelector("input[type='file']");

const canvas = document.getElementById("bb-preview");
const canvas_ctx = canvas.getContext("2d");

upload_box.addEventListener("click", () =>{
    input_element.click();
});
input_element.addEventListener("change", handleImageSelect);

function handleImageSelect(e){
    e.preventDefault();
    const imageData = this.files[0];
    previewImage().then((ratio) => {
        call_model_API(imageData, ratio);
    }).catch((error) => {
        console.log(`An error occured: ${error}`);
    });
}

function call_model_API(imageData, ratio){
    const url = "http://127.0.0.1:8000/upload/";
    const formData = new FormData();
    formData.append("file", imageData, imageData.name);

    const fetchOptions = {
        method: "POST",
        body: formData
    };

    fetch(url, fetchOptions)
    .then(res => res.json())
    .then(data => {
        console.log(data.result);
        canvas.classList.remove("blurred");
        upload_box_text.style.display = "none";
        draw_bounding_boxes(data, ratio);
    })
}

function draw_bounding_boxes(results, ratio){
    // Draw the bounding boxes
    boxes = results.result.boxes;
    classes = results.result.classes;
    scores = results.result.scores;

    img_height = canvas.height / ratio;
    img_width = canvas.width / ratio;
    num_rows = Math.ceil(img_height / 256);
    num_cols = Math.ceil(img_width / 256);
    
    for(i = 0; i < boxes.length; i++){
        subset_boxes = boxes[i];
        subset_classes = classes[i];
        subset_scores = scores[i];

        for(j = 0; j < subset_boxes.length; j++){
            box = subset_boxes[j];
            cls = subset_classes[j];
            score = subset_scores[j];

            cur_row = Math.max(Math.floor(i / num_cols) * 256, 1);
            cur_col = Math.max(i % num_cols * 256, 1);

            if(box.length > 0){
                x = (box[0] + (cur_col)) * ratio;
                y = (box[1] + (cur_row)) * ratio;
                box_width = (box[2] - box[0]) * ratio;
                box_height = (box[3] - box[1]) * ratio;
                canvas_ctx.fillRect(x, y, box_width, box_height);
                canvas_ctx.fillText(cls, x, y);
            }
        }
    }
}

function previewImage(){
    //e.preventDefault();
    return new Promise((resolve, reject) => {
        const file = input_element.files[0];
        const reader = new FileReader();
        ratio = 0;

        // This load handles the file being read into the reader,
        // not the image into the img_preview
        reader.addEventListener("load", () => {
            // Create the image and draw it on the Canvas
            const img_preview = document.createElement("img");
            img_preview.src = reader.result;

            // The reason that we need this is because when we
            // set the image source, we have to wait for the
            // image to finish load into the variable
            img_preview.addEventListener("load", () => {
                canvas.classList.add("blurred");
                const aspect = img_preview.height / img_preview.width;
                // console.log(`canvas height: ${canvas.height} aspect: ${aspect}`);
                canvas.height = canvas.width * aspect;
                ratio = canvas.width / img_preview.width;
                canvas_ctx.drawImage(img_preview, 0, 0, canvas.width, canvas.height);

                upload_box_text.textContent = "Finding Waldo";
                upload_box_text.style.display = "block";

                resolve(ratio);
            });
        });

        if (file) {
            // Swap the text for a canvas and read the file
            canvas.style.display = 'block';
            upload_box_text.style.display = "none";
            reader.readAsDataURL(file);
        }else{
            reject("Invalid Image passed");
        }
    })
}
