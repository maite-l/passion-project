
const video = document.getElementById('video');
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const resultDiv = document.getElementById('result');

let prevFrame = [];

const getMotion = (maxTotalMotion) => {

    const differenceThreshold = 50;
    let totalMotion = 0;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // calculate the average luminance of the image + normalise
    for (let i = 0; i < imageData.length; i += 4) {
        const red = imageData[i];
        // if there is enough difference between the current and previous frame in the red channel, add it to the total
        if (prevFrame[i] && Math.abs(prevFrame[i] - red) > differenceThreshold) {
            totalMotion += Math.abs(prevFrame[i] - red);
        }
    }
    const normalisedMotion = Math.min(totalMotion / maxTotalMotion, 1);

    // save the current frame for the next iteration
    prevFrame = imageData;

    resultDiv.innerHTML = `Motion: ${normalisedMotion.toFixed(2)}`;
}


const init = () => {

    // get the maximum possible difference between two colours for normalisation later
    const maxPossibleDifference = 255;
    const maxPixels = canvas.width * canvas.height;
    const adjustedMaxPixels = maxPixels / 1.8;
    const maxTotalMotion = maxPossibleDifference * adjustedMaxPixels;

    // canvas is only used to get the pixel data
    canvas.style.display = 'none';

    // get webcam stream
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(error => {
            console.error('Error accessing webcam:', error);
        });

    // wait for the video metadata to load
    video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    });

    // draw webcam frames onto the canvas
    video.addEventListener('play', () => {
        const processFrame = () => {
            if (video.paused || video.ended) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            getMotion(maxTotalMotion); // get the colours from the canvas
            setTimeout((processFrame), 1000); // process next frame after 1 second
        }
        processFrame();
    });

}

init();