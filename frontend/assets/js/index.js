APIKEY = "OTp3HH4Igk1yQPqKCgipEIdWx25I6sI21UUr8DBf";

// upload to S3 bucket via PUT method
function upload(e) {
  e.preventDefault();
  console.log("upload to S3");

  let fileInfo = $("#upload-photo-form")[0].files[0];
  // Format filename (remove spaces)
  let filename = fileInfo.name.replace(/\s/g, "");
  console.log("Filename", filename);
  let customLabels = $("#custom-labels").val();
  console.log("custom-labels", customLabels);

  // Convert Image to Base 64
  // https://stackoverflow.com/questions/36280818/how-to-convert-file-to-base64-in-javascript
  function getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file);
      reader.onload = () => resolve(reader.result);
      reader.onload = () => {
        let encoded = reader.result.replace(/^data:(.*;base64,)?/, "");
        if (encoded.length % 4 > 0) {
          encoded += "=".repeat(4 - (encoded.length % 4));
        }
        resolve(encoded);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  // Uploading to S3 bucket via API /PUT method
  async function uploadphotoPUT() {
    e.preventDefault();
    console.log("Upload button clicked...");

    // Connect to API Gateway
    let apigClient = apigClientFactory.newClient({
      apiKey: APIKEY,
      defaultContentType: fileInfo.type,
    });
    console.log("apigClient", apigClient);
    console.log("Content-Type", fileInfo.type);

    let params = {
      folder: "photoalbum-assignment-wzxcm-b2",
      item: filename,
      "Content-Type": fileInfo.type,
      "x-amz-meta-customLabels": customLabels, // Add custom labels here *
    };
    let additionalParams = {};

    // console.log("fileInfo", fileInfo);
    // let body = ;
    // apigClient.uploadFolderItemPut(params, body, additionalParams)
    //         .then(function(res){
    //          console.log("Upload SUCCESS");
    //         }).catch( function(result){
    //           alert("UPLOAD FAILED");
    //         });

    getBase64(fileInfo).then((data) => {
      let body = data;
      console.log("images:", body);
      apigClient
        .uploadFolderItemPut(params, body, additionalParams)
        .then(function (res) {
          console.log("Upload SUCCESS");
        })
        .catch(function (result) {
          alert("UPLOAD FAILED");
        });
    });
  }

  uploadphotoPUT();
}

// search for images
function search(e) {
  e.preventDefault();

  // Clear previous search results
  let node = document.getElementById("photo-grid");
  node.innerHTML = "";

  // Get user's input
  let searchquery = $("#transcript").val();
  console.log("SEARCH QUERY: ", searchquery);

  var params = { q: searchquery };
  var body = {};
  var additionalParams = {};

  // Search using via GET method
  async function searchAPI(params, body, additionalParams) {
    // Connect to API Gateway
    let apigClient = apigClientFactory.newClient({ apiKey: APIKEY });
    console.log("apigClient", apigClient);

    try {
      // API GATEWAY
      const getresponse = await apigClient.searchGet(
        params,
        body,
        additionalParams
      );

      if (getresponse) {
        let pictures = getresponse.data;
        if (pictures.length === 0) {
          let pNode = document.createElement("P");
          let textnode = document.createTextNode("No images found.");
          pNode.append(textnode);
          document.getElementById("photo-grid").appendChild(pNode);
          return;
        }

        // Render images
        for (i = 0; i < pictures.length; i++) {
          let pic = document.createElement("img");
          pic.src = "https://s3.amazonaws.com/photoalbum-assignment-wzxcm-b2/" + pictures[i];
          pic.style.margin = "3px";
          pic.style.height = "200px";
          document.getElementById("photo-grid").appendChild(pic);
        }
      }
    } catch (error) {
      console.log("Error", error);
    }
  }

  searchAPI(params, body, additionalParams);
}
