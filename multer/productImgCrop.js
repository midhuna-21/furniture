const sharp = require('sharp');
const fs = require('fs');

module.exports = {
    crop: async (req) => {
        console.log("call comes");
        if (req.files && req.files.length > 0) { // Check if req.files is defined and has elements
            for (let i = 0; i < req.files.length; i++) {
                const inputFilePath = req.files[i].path;

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
            }
        } else {
            console.log("No files to process");
        }
    }
};
