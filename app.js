if (process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport  = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

app.set("views",path.join(__dirname,"views")); //tells vs code to look into dirname of index.js/views to look for ejs files
app.set("view engine","ejs"); //sets the engine which serves the ejs files
app.use(express.json());
app.use(express.static(path.join(__dirname,"public"))); //tells express to take static files from this folder
app.use(express.urlencoded({extended:true})); //middleware in Express.js used to parse incoming POST req. This middleware makes the form data available in req.body
app.use(methodOverride("_method")); //used for overriding the form's default GET and POST actions
app.engine('ejs',ejsMate); //sets the engine which serves the partial ejs files

main()
.then((res)=>{
    console.log("connection successful")
})
.catch(err => console.log(err));

async function main() {
  await mongoose.connect(process.env.ATLASDB_URL);
}

const store = MongoStore.create({
    mongoUrl : process.env.ATLASDB_URL,
    crypto:{
        secret:process.env.SECRET
    },
    touchAfter:24*3600,
});

store.on("error", ()=>{
    console.log("ERROR in MONGO SESSION STORE",err);
})

const sessionOptions = {
    store,
    secret: process.env.SECRET,
    resave :false,
    saveUninitialized : true,
    cookie :{
        expires: Date.now() + 7 *24*60*60*1000,
        maxAge: 7 *24*60*60*1000,
        httpOnly: true,
    }
}

// app.get("/",(req,res)=>{
//     res.send("root working..");
// })

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) =>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.all("*", (req,res,next)=>{
    next(new ExpressError(404, "Page Not Found!"));
})

app.use((err, req, res, next)=> {
    console.log(err);
    let {statusCode=500, message="Something went wrong!"} = err;
    res.status(statusCode).render("error.ejs", {message});
})

app.listen(process.env.PORT, () => {
    console.log(`Server is listening on port ${process.env.PORT}`);
});