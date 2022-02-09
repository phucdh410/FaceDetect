const container = document.querySelector("#container");
const fileInput = document.querySelector("#file-input");

const loadTrainingData = async () => {
  const labels = ["BichPhuong", "DenVau", "SonTungMTP", "Hương Vy"];

  const faceDescriptors = [];
  for (const label of labels) {
    const descriptors = [];
    for (let i = 1; i <= 7; i++) {
      const image = await faceapi.fetchImage(`/data/${label}/${i}.jpg`);
      const detection = await faceapi
        .detectSingleFace(image)
        .withFaceLandmarks()
        .withFaceDescriptor();
      descriptors.push(detection.descriptor);
    }
    faceDescriptors.push(
      new faceapi.LabeledFaceDescriptors(label, descriptors)
    );
    Toastify({
      text: `Training xong dữ liệu của ${label}`,
    }).showToast();
  }
  return faceDescriptors;
};

let faceMatcher;
const init = async () => {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  ]);

  const trainingData = await loadTrainingData();
  faceMatcher = new faceapi.FaceMatcher(trainingData, 0.6);

  Toastify({
    text: `Tải xong model nhận diện`,
  }).showToast();
};
init();

fileInput.addEventListener("change", async (e) => {
  const file = fileInput.files[0];

  const image = await faceapi.bufferToImage(file);
  const canvas = faceapi.createCanvasFromMedia(image);

  container.innerHTML = "";
  container.append(image);
  container.append(canvas);

  const size = {
    width: image.width,
    height: image.height,
  };
  faceapi.matchDimensions(canvas, size);

  const detections = await faceapi
    .detectAllFaces(image)
    .withFaceLandmarks()
    .withFaceDescriptors();
  const resizedDetections = faceapi.resizeResults(detections, size);

  for (const detection of resizedDetections) {
    const box = detection.detection.box;
    const drawBox = new faceapi.draw.DrawBox(box, {
      label: faceMatcher.findBestMatch(detection.descriptor),
    });
    drawBox.draw(canvas);
  }
});
