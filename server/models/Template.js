import mongoose from 'mongoose';
const { Schema } = mongoose;

const HeaderFooterSchema = new Schema({
  DrId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  headerImage: {
    type: String, // file path or base64 string
    required: false
  },
  footerImage: {
    type: String, // file path or base64 string
    required: false
  }
});

const Template = mongoose.model('Template', HeaderFooterSchema);

export default Template;
