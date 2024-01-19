
const video = document.getElementById('video');
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const paletteDiv = document.getElementById('palette');


const colourDifference = (colour1, colour2) => {
    // Euclidean distance between two RGB colours https://en.wikipedia.org/wiki/Color_difference
    const rDiff = colour1[0] - colour2[0];
    const gDiff = colour1[1] - colour2[1];
    const bDiff = colour1[2] - colour2[2];
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

const parseRGB = (rgbString) => {
    return rgbString.match(/\d+/g).map(Number);
}

const getColours = () => {

    const colourAmount = 5;
    const differenceThreshold = 80;

    // get pixel data from the canvas
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;


    // make object with colour and how many times it appears
    const colourCounts = {};
    for (let i = 0; i < imageData.length; i += 4) {
        const colour = [imageData[i], imageData[i + 1], imageData[i + 2]];
        const colourString = `rgb(${colour[0]}, ${colour[1]}, ${colour[2]})`;
        if (colourString in colourCounts) {
            colourCounts[colourString] = colourCounts[colourString] + 1;
        } else {
            colourCounts[colourString] = 1;
        }
    }

    // sort colours by how many times they appear
    const sortedColours = Object.keys(colourCounts).sort((a, b) => colourCounts[b] - colourCounts[a]);

    // get the most common colours that are different enough
    const colourPalette = [sortedColours[0]];
    for (let i = 1; i < sortedColours.length; i++) {
        const currentColour = sortedColours[i];

        const include = colourPalette.every(paletteColour => {
            const difference = colourDifference(
                parseRGB(currentColour),
                parseRGB(paletteColour)
            );
            return difference >= differenceThreshold;
        });

        if (include && colourPalette.length < colourAmount) {
            colourPalette.push(currentColour);
        }
    }

    // display colour palette
    paletteDiv.innerHTML = '';
    colourPalette.forEach(colour => {
        const colourDiv = document.createElement('div');
        colourDiv.style.width = '2rem';
        colourDiv.style.height = '2rem';
        colourDiv.style.display = 'inline-block';
        colourDiv.style.backgroundColor = colour;
        paletteDiv.appendChild(colourDiv);
    });
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
            getColours(); // get the colours from the canvas
            setTimeout((processFrame), 1000); // process next frame after 1 second
        }
        processFrame();
    });

}

init();