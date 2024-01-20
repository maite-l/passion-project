
const video = document.getElementById('video');
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const resultDiv = document.getElementById('result');

const getContrast = () => {

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // calculate the average luminance of the image + normalise
    let totalLuminance = 0;
    for (let i = 0; i < imageData.length; i += 4) {
        totalLuminance += (0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2]);
    }
    const averageLuminance = totalLuminance / imageData.length / 4;
    const normalisedAvgLuminance = averageLuminance / 255;

    // calculate the mean squared difference between each pixel and the average luminance 
    let squaredDeviationsSum = 0;
    for (let i = 0; i < imageData.length; i += 4) {
        const luminance = (0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2]);
        const normalisedLuminance = luminance / 255;
        const difference = normalisedLuminance - normalisedAvgLuminance;
        squaredDeviationsSum += difference * difference;
    }
    
    const variance = squaredDeviationsSum / imageData.length / 4;

    //const standardDeviation = Math.sqrt(variance);

    // adjust contrast so max and min can be reached easily
    const adjustedContrast = variance * 100 / 2;

    // cap contrast at 1
    const contrast = Math.min(adjustedContrast, 1);
    resultDiv.innerHTML = `Contrast: ${contrast.toFixed(2)}`;
}


const init = () => {

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
            getContrast(); // get the colours from the canvas
            setTimeout((processFrame), 1000); // process next frame after 1 second
        }
        processFrame();
    });

}

init();