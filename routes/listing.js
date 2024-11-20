const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const lisitngController = require("../controllers/listings.js");
const multer  = require('multer'); //used for parsing files through form to the backend
const {storage} = require('../cloudConfig.js');
const upload = multer({storage}); 

router.route("/")
.get(wrapAsync(lisitngController.index))
.post(isLoggedIn,upload.single('listing[image.url]'),validateListing,wrapAsync(lisitngController.createListing));

//New Route
router.get("/new",isLoggedIn, lisitngController.renderNewForm);

router.route("/:id")
.get(wrapAsync(lisitngController.showListing))
.put(isLoggedIn,isOwner, upload.single('listing[image.url]'),validateListing,wrapAsync(lisitngController.updateListing))
.delete(isLoggedIn,isOwner,wrapAsync(lisitngController.destroyListing));

//Edit Route
router.get("/:id/edit",isLoggedIn,isOwner,wrapAsync(lisitngController.renderEditForm));

module.exports = router;
