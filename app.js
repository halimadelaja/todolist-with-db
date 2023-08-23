//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/public/js/date.js");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const homeItems = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//connect to mongoose
mongoose.connect("mongodb+srv://admin-halima:Test123@cluster0.lkqrg2p.mongodb.net/todolistDB?retryWrites=true&w=majority");
//"mongodb+srv://admin-halima:Test123@cluster0.lkqrg2p.mongodb.net/todolistDB?retryWrites=true&w=majority"

//Schema for Items
const itemsSchema = new mongoose.Schema({
  name: String
});

//Model for Items Collection
const Item = new mongoose.model("Item", itemsSchema);

//document/entry insertMany
const item1 = new Item ({
  name: "Welcome to your Todo List"
});
const item2 = new Item ({
  name: "Hit the + button to add a new item"
});
const item3 = new Item ({
  name:"<-- Hit this to delete an item"
});
const defaultItems = [item1, item2, item3];

//Schema for Lists
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

//Model for Lists Collection 
const List = new mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  const day = date.getDate();

  Item.find({}, function(err, foundItems){ //returns an array of objects


    if(foundItems.length === 0){
      // insertMany was outside the app.get() before 
      Item.insertMany(defaultItems, function(err){ //or you can list the items singly in an array form
        if(err){
          console.log(err);
          
        }else{
          console.log("Successfully added default items to DB");
          
        }
      });
      res.redirect("/")
    }else{
      res.render("list", {listTitle: day, newListItems: foundItems});
    }


    // if(err){
    //   console.log(err);
      
    // }else{
      // console.log(foundItems);

      // res.render("list", {listTitle: day, newListItems: foundItems});
      
    // }

    // Angela did not include the commented part above, she went from Item.find({}, function(err, foundItems){ to
    // res.render("list", {listTitle: day, newListItems: foundItems});
    
  });

});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/:customListName", function(req,res){
  // console.log(req.param.customListName);
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName}, function(err, foundList){ // returns a single object
    if(!err){
      if(!foundList){
        // console.log("Doesn't exist!");
        
        //create new list
        const list = new List({
          name:customListName,
          items: defaultItems
        });
    
        list.save();
        res.redirect("/" + customListName)
      }else{
        //console.log("Exists!");

        //display existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        
      }
    }
  });

  

});

app.post("/", function(req, res){

  const day = date.getDate();
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });


  if(listName === day){
    item.save();

    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
  });
  }

  

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   homeItems.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete", function(req, res){
  // console.log(req.body.checkBox); //nothing gets displayed because we have no button attached, hence we need an hidden input
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;

  if(listName === day){
    Item.findByIdAndRemove(checkedItemId, function(err){ //without callback here, it won't delete, instead, it'll only find and return the item with the id
    if(!err){
      console.log("Successfullly deleted item from database");
      res.redirect("/")
    }
  });

  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
    
  }
  
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
