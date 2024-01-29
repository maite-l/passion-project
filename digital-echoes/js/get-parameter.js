export const getContrast = (ctx, canvas) => {
    // get pixel data from the canvas
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
    return Math.min(adjustedContrast, 1);
}

let prevFrame = [];
export const getMotion = (ctx, maxTotalMotion, canvas) => {

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
    let motion = Math.min(totalMotion / (maxTotalMotion), 1);

    // save the current frame for the next iteration
    prevFrame = imageData;

    return motion;
}


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

export const getColours = (ctx, canvas) => {
    const colourAmount = 3;
    const differenceThreshold = 100;

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

    // get the most common colours that are different enough and not too close to black
    let newColourPalette = [];
    for (let i = 0; i < sortedColours.length; i++) {
        let currentColour = sortedColours[i];

        let currentParsedColour = parseRGB(currentColour);
        let isWhite = false; let isBlack = false;
        if (currentParsedColour[0] > 240 || currentParsedColour[1] > 240 || currentParsedColour[2] > 240) {
            isWhite = true;
        }
        if (currentParsedColour[0] < 60 || currentParsedColour[1] < 60 || currentParsedColour[2] < 60) {
            isBlack = true;
        }


        const include = newColourPalette.every(paletteColour => {
            const difference = colourDifference(
                parseRGB(currentColour),
                parseRGB(paletteColour)
            );
            return difference >= differenceThreshold;
        });

        if (include && newColourPalette.length < colourAmount && !isWhite && !isBlack) {
            newColourPalette.push(currentColour);
        }
    }
    return newColourPalette.map(colour => parseRGB(colour).map(c => c / 255));
}
