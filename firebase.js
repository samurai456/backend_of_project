const { initializeApp } = require('firebase/app')
const { getStorage } = require('firebase/storage')

const firebaseConfig = {
  apiKey: "AIzaSyDoifaOPZxO8p0CPuRuef2Qihr85i9jTP0",
  authDomain: "uploadingfile-5a6a7.firebaseapp.com",
  projectId: "uploadingfile-5a6a7",
  storageBucket: "uploadingfile-5a6a7.appspot.com",
  messagingSenderId: "79904197875",
  appId: "1:79904197875:web:2616a79dda84cc2084fb86"
};

const app = initializeApp(firebaseConfig)
const storage = getStorage(app)

module.exports = { storage }