
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) =>{
        console.log('uploading to file')
        cb(null, 'public/uploadCategory');
    },
    filename:(req, file, cb) =>{
        // console.log('data file getting')
    const originalname = file.originalname;
    const extname = path.extname(originalname);
    const basename = path.basename(originalname);
    const filename = `${Date.now()}-${basename}${extname}`;
    cb(null, filename);
    }
})
const upload = multer({storage})

module.exports = upload;