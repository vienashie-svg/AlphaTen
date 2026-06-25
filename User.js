const mongoose = require("mongoose");
const { type } = require("node:os");

const UserSchema = new mongoose.Schema({
  fullName: String,
  email: {
      type: String,
      unique: true
  },
  password: String
});

const notificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const savedCourseSchema = new mongoose.Schema({
  name: String,
  mode: String,
  tuition: Number
});

const paymentSchemeSchema = new mongoose.Schema({
  type: String,
  amount: Number
});

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "student"
  },
  userInformation: {
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    age: { type: Number, default: 0 }
  },
  tourProgress: {
    type: Number,
    default: 35
  },
  savedCourses: [savedCourseSchema],
  applicationStatus: {
    type: String,
    default: "Pending"
  },
  settings: {
    email: { type: String, default: "" }
  },
  pricingComparison: {
    onlineTuition: { type: Number, default: 15000 },
    limitedFtfTuition: { type: Number, default: 25000 },
    paymentSchemes: {
      type: [paymentSchemeSchema],
      default: [
        { type: "Full Payment - Online", amount: 15000 },
        { type: "Installment - Online", amount: 8000 },
        { type: "Full Payment - Limited FTF", amount: 25000 },
        { type: "Installment - Limited FTF", amount: 13000 }
      ]
    }
  },
  notifications: {
    type: [notificationSchema],
    default: [
      {
        title: "System Update",
        message: "Portal improvements were deployed successfully.",
        read: false
      },
      {
        title: "Announcement",
        message: "Enrollment period has been extended until Friday.",
        read: false
      }
    ]
  },
  systemStatus: {
    type: Number,
    default: 82
  },
  helpCenter: {
    faqs: {
      type: [String],
      default: [
        "How do I enroll?",
        "How do I change my password?",
        "How do I check application status?"
      ]
    }
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);