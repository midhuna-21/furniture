const sharp = require('sharp');
const fs = require('fs');

module.exports = {
    crop: async (req) => {
        console.log("call comes");
        if (req.file) { // Check if req.file is defined
            const inputFilePath = req.file.path;

            try {
                const processedImageBuffer = await sharp(inputFilePath)
                    .resize(150, 150, {
                        kernel: sharp.kernel.nearest,
                        fit: 'fill',
                        position: 'right top',
                    })
                    .toBuffer();

                fs.writeFileSync(inputFilePath, processedImageBuffer); // Use synchronous writeFile to ensure proper ordering

                console.log("Image cropped and saved successfully to ", inputFilePath);
            } catch (error) {
                console.log("Error while cropping and saving the image:", error);
            }
        } else {
            console.log("No file to process");
        }
    }
};
