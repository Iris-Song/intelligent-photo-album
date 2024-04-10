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

  // Uploading to S3 bucket via API /PUT method
  function uploadPhotoAxios() {

    let additionalParams = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, PUT',
            'Access-Control-Allow-Headers':'*',
            'Content-Type': fileInfo.type,
            'x-amz-meta-customlabels': customLabels
        }
    };
    url = "https://phnp6gfh80.execute-api.us-east-1.amazonaws.com/t/upload/photoalbum-assignment-wzxcm-b2/" + filename
    axios.put(url, fileInfo, additionalParams).then(res => {
      if (res.status == 200){
        alert("UPLOAD SUCCESS");
        document.getElementById("upload-photo-form").value = "";
        document.getElementById("custom-labels").value = "";
      }else{
        alert("UPLOAD FAILED");
      }
    });
  }

  uploadPhotoAxios();
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
