const listing = require("../models/listing.js");
const axios = require('axios');



module.exports.index = async (req,res)=>{
    const allListings = await listing.find();
    res.render("./listings/index.ejs",{allListings});
}

module.exports.category = async(req,res)=>{
    let {cate} = req.params;
    const allListings = await listing.find({category:cate});
    if(allListings.length!=0){
        res.render("./listings/index.ejs",{allListings});
    }else{
        req.flash("error","This category does not have any listing");
        res.redirect("/listings");
    }
}

module.exports.searchPlace = async(req,res)=>{
    let {place} = req.body;
    let arr = place.split(",");
    const allList = await listing.find();
    let allListings = allList.filter((list)=>list.location.split(",")[0] === arr[0]);
    if(allListings.length!=0){
        res.render("./listings/index.ejs",{allListings});
    }else{
        req.flash("error","This Destination does not have any listing");
        res.redirect("/listings");
    }
}

module.exports.renderNewForm = (req,res)=>{
    res.render("./listings/new.ejs");
}

module.exports.createListing =async (req,res)=>{
    // console.log(req.body);
    let url = req.file.path;
    let filename = req.file.filename;
    const newList = new listing(req.body.listing);
    newList.owner = req.user._id;
    newList.image = {url,filename};
    let locate = newList.location;
    // let locationiqUrl = `https://us1.locationiq.com/v1/search?key=${process.env.LOCATION_API_KEY}&q=${locate}&format=json`;
    let locationiqUrl = `https://www.google.co.in/maps/place/GLA+University/@27.6056934,77.5907496,17z/data=!3m1!4b1!4m6!3m5!1s0x39736ce47bffc039:0xfe5fc3da92c6341!8m2!3d27.6056887!4d77.5933245!16s%2Fm%2F0ryvc6s?entry=ttu`;
    let addresscoord = await axios.get(locationiqUrl);
    let coords = addresscoord.data[0];
    newList.geometry.coordinates[0] = coords.lat;
    newList.geometry.coordinates[1] = coords.lon;
    let savedList = await newList.save();
    req.flash("success","New listing created successfully !");
    res.redirect("/listings");      
}

module.exports.showListings =async (req,res)=>{
    let {id} = req.params;
    const list = await listing.findById(id).populate({path:"reviews", populate:{path:"author"}}).populate("owner");
    if(!list){
        req.flash("error","Listing Does not exist");
        res.redirect("/listings");
    }
    res.render("./listings/show.ejs",{list});
}

module.exports.renderEditForm =async (req,res)=>{
    let{id} = req.params;
    const list = await listing.findById(id);
    if(!list){
        req.flash("error","Listing Does not exist");
        res.redirect("/listings")
    }
    let originalUrl = list.image.url;
    originalUrl = originalUrl.replace("/upload","/upload/w_250");
    res.render("./listings/edit.ejs",{list,originalUrl});
}

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    let list = await listing.findByIdAndUpdate(id, { ...req.body.listing });

    let locate = list.location;
    // Mock URL for testing purposes
    let locationiqUrl = `https://jsonplaceholder.typicode.com/posts/1`;
    let addresscoord = await axios.get(locationiqUrl);
    let coords = addresscoord.data;
    list.geometry.coordinates[0] = coords.id;
    list.geometry.coordinates[1] = coords.userId;
    
    if (req.file) {
        let url = req.file.path;
        let filename = req.file.filename;
        list.image = { url, filename };
    }

    await list.save();

    req.flash("success", "Listing updated successfully");
    res.redirect(`/listings/${id}`);
};


module.exports.destroyListing = async (req,res)=>{
    let{id} = req.params;
    await listing.findByIdAndDelete(id);
    req.flash("success","listing DELETED :(");
    res.redirect("/listings");
}