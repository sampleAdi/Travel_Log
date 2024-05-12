if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require('path');
const methodoverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require("./utils/ExpressError.js");
const listingsRoute = require("./routes/listings.js");
const reviewsRoute = require("./routes/reviews.js"); 
const userRoute = require("./routes/user.js"); 
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require("passport");
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');

app.use(express.static(path.join(__dirname,"public")));
app.use(methodoverride("_method"));
app.use(express.urlencoded({extended:true}));

const dbUrl = 'mongodb://localhost:27017/wanderlust';

main()
    // .then(() => {
    //     console.log("db connected");
    // })
    // .catch((err) => {
    //     console.log(err);
    // });

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
})

const sessionOptions = {
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly:true,
    }
}

async function main() {
    await mongoose.connect('mongodb://localhost:27017/wanderlust')
    .then('done')
    .catch('error')
}

app.set("views",path.join(__dirname,"views"))
app.set("view engine","ejs");

app.engine("ejs",ejsMate);

main().then(()=>{console.log("connection is successfull")}).catch(err=>{console.log(err)});

async function main() {
    await mongoose.connect(dbUrl);
}

// process.env.ATLASDB_URL;

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

app.use("/listings",listingsRoute);
app.use("/listings/:id/reviews",reviewsRoute);
app.use("/",userRoute);


app.get("/listings/category/:cat",listingsRoute);

app.get("/",(req,res)=>{
    res.redirect("/listings");
})

app.get("/testlistings", async (req,res)=>{
    let list1 = new listing({
        title:"Cozy Studio Apartment",
        description:"A charming studio apartment in the heart of the city.",
        price: 1000,
        location:"Downtown",
        country:"United States"
    });
    await list1.save();
    console.log("successfully saved");
    res.send("success");
})

app.get("/",(req,res)=>{
    res.send("Hii, I'm Groot");
})

app.get("/demouser", async(req,res)=>{
    let fakeUser = new User ({
        _id: "65fbad48c56397d13aaddc4a",
        email:"student@gmail.com",
        username:"student-01"
    });

    const registeredUser = await User.register(fakeUser,"helloworld");
    res.send(registeredUser);
})

app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page not found :( "));
})

app.use((err,req,res,next)=>{
    let{statusCode=500,message="Something went wrong"} = err;
    // res.status(statusCode).send(message);
    console.log(err);
    res.status(statusCode).render("error.ejs",{message});
})

app.listen(3000,()=>{
    console.log("app is listening at port 3000");
})

