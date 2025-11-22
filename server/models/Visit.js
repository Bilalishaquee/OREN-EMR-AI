import mongoose from 'mongoose';

// Base schema for all visits
const baseVisitSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: String
  },
  {
    discriminatorKey: 'visitType', // ✅ Mongoose will add this automatically
    collection: 'visits',
    timestamps: true // ✅ for createdAt and updatedAt
  }
);

const Visit = mongoose.model('Visit', baseVisitSchema);

const initialVisitSchema = new mongoose.Schema({
  chiefComplaint: { type: String, required: true },

  vitals: {
    height: String,
    weight: String,
    temp: String,
    bp: String,
    pulse: String
  },

  grip: {
    right1: String,
    right2: String,
    right3: String,
    left1: String,
    left2: String,
    left3: String
  },

  appearance: [String],
  appearanceOther: String,

  orientation: {
    timePlacePerson: Boolean,
    otherChecked: Boolean,
    other: String
  },

  posture: [String],
  gait: [String],
  gaitDevice: String,

  dtr: [String],
  dtrOther: String,

  dermatomes: [String],
  dermatomesHypoArea: String,
  dermatomesHyperArea: String,

  muscleStrength: [String],
  strength: {
    C5: String,
    C6: String,
    C7: String,
    C8: String,
    T1: String,
    L2: String,
    L3: String,
    L4: String,
    L5: String,
    S1: String
  },

  oriented: Boolean,
  neuroNote: String,
  coordination: Boolean,
  romberg: [String],
  rombergNotes: String,
  pronatorDrift: String,
  neuroTests: [String],
  walkTests: [String],
  painLocation: [String],
  radiatingTo: String,

  jointDysfunction: [String],
  jointOther: String,

  chiropracticAdjustment: [String],
  chiropracticOther: String,
  acupuncture: [String],
  acupunctureOther: String,
  physiotherapy: [String],
  rehabilitationExercises: [String],

  durationFrequency: {
    timesPerWeek: Number,
    reEvalInWeeks: Number
  },

  referrals: [String],

  imaging: {
    xray: [String],
    mri: [String],
    ct: [String]
  },

  diagnosticUltrasound: String,
  nerveStudy: [String],

  restrictions: {
    avoidActivityWeeks: Number,
    liftingLimitLbs: Number,
    avoidProlongedSitting: Boolean
  },

  disabilityDuration: String,
  otherNotes: String,

  arom: mongoose.Schema.Types.Mixed,  // object of { bodyPart: { movement: { wnl, exam, pain } } }
  ortho: mongoose.Schema.Types.Mixed, // object of { test: { left, right, ligLaxity? } }

  tenderness: mongoose.Schema.Types.Mixed, // object of { region: [labels] }
  spasm: mongoose.Schema.Types.Mixed,      // object of { region: [labels] }

  lumbarTouchingToesMovement: {
    pain: Boolean,
    painTS: Boolean,
    painLS: Boolean,
    acceleration: Boolean,
    accelerationTSPain: Boolean,
    accelerationLSPain: Boolean,
    deceleration: Boolean,
    decelerationTSPain: Boolean,
    decelerationLSPain: Boolean,
    gowersSign: Boolean,
    gowersSignTS: Boolean,
    gowersSignLS: Boolean,
    deviatingLumbopelvicRhythm: Boolean,
    deviatingFlexionRotation: Boolean,
    deviatingExtensionRotation: Boolean
  },

  cervicalAROMCheckmarks: {
    pain: Boolean,
    poorCoordination: Boolean,
    abnormalJointPlay: Boolean,
    motionNotSmooth: Boolean,
    hypomobilityThoracic: Boolean,
    fatigueHoldingHead: Boolean
  },

  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }

}, { timestamps: true });




const followupVisitSchema = new mongoose.Schema({
  previousVisit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: true
  },

  // Reevaluation Form Fields
  areas: String,
  areasImproving: Boolean,
  areasExacerbated: Boolean,
  areasSame: Boolean,
  musclePalpation: String,
  painRadiating: String,
  romWnlNoPain: Boolean,
  romWnlWithPain: Boolean,
  romImproved: Boolean,
  romDecreased: Boolean,
  romSame: Boolean,

  orthos: {
    tests: String,
    result: String
  },

  activitiesCausePain: String,
  activitiesCausePainOther: String,

  treatmentPlan: {
    treatments: String,
    timesPerWeek: String
  },

  overallResponse: {
    improving: Boolean,
    worse: Boolean,
    same: Boolean
  },

  referrals: String,

  diagnosticStudy: {
    study: String,
    bodyPart: String,
    result: String
  },

  homeCare: String,

  notes: String, // ⬅️ if not included in base schema, add it here

  // ✅ ADDITIONS FOR MODAL-FETCHED DATA

  // Muscle Palpation Modal
  muscleStrength: [String],
  strength: mongoose.Schema.Types.Mixed,
  tenderness: mongoose.Schema.Types.Mixed,
  spasm: mongoose.Schema.Types.Mixed,

  // Ortho Tests Modal
  ortho: mongoose.Schema.Types.Mixed,
  arom: mongoose.Schema.Types.Mixed,

  // Activities/Treatment Plan Modal
  chiropracticAdjustment: [String],
  chiropracticOther: String,
  acupuncture: [String],
  acupunctureOther: String,
  physiotherapy: [String],
  rehabilitationExercises: [String],
  durationFrequency: {
    timesPerWeek: String,
    reEvalInWeeks: String
  },
  diagnosticUltrasound: String,
  disabilityDuration: String,

  // Treatment List Modal
  nerveStudy: [String],
  restrictions: {
    avoidActivityWeeks: String,
    liftingLimitLbs: String,
    avoidProlongedSitting: Boolean
  },
  otherNotes: String,

  // Imaging and Referrals Modal
  imaging: {
    xray: [String],
    mri: [String],
    ct: [String]
  }

}, { timestamps: true });


// Discharge Visit Schema
const dischargeVisitSchema = new mongoose.Schema({
  areasImproving: Boolean,
  areasExacerbated: Boolean,
  areasSame: Boolean,

  musclePalpation: String,
  painRadiating: String,
  romPercent: Number,
  orthos: {
    tests: String,
    result: String
  },
  activitiesCausePain: String,
  otherNotes: String,

  prognosis: String, // selected prognosis
  diagnosticStudy: {
    study: String,
    bodyPart: String,
    result: String
  },
  futureMedicalCare: [String],
  croftCriteria: String,
  amaDisability: String,
  homeCare: [String],
  referralsNotes: String
});


// Discriminators (no `visitType` manually added here)
const InitialVisit = Visit.discriminator('initial', initialVisitSchema);
const FollowupVisit = Visit.discriminator('followup', followupVisitSchema);
const DischargeVisit = Visit.discriminator('discharge', dischargeVisitSchema);



export { Visit, InitialVisit, FollowupVisit, DischargeVisit };
