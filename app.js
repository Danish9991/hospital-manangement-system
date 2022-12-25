const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const path = require("path");
const nodemailer = require("nodemailer");
const Nexmo = require("nexmo");
var file = path.join(__dirname,"./public/pdf/businesscard.pdf");
var fs = require("fs");
var pdf = require("html-pdf");
var html = fs.readFileSync("views/crm.ejs","utf-8");
var options = { format:"a4"};
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine", "ejs");

app.locals.pdf = require("html-pdf");
app.locals.html = fs.readFileSync("views/crm.ejs","utf-8");
app.locals.options = {format:"a4"};
app.locals.fs = require("fs");


const ejs = require("ejs");
const mongoose = require("mongoose");
const { parse } = require("path");
mongoose.connect('mongodb://localhost:27017/hospital', {useNewUrlParser: true});
const patientSchema = new mongoose.Schema({
    name:String,
    age:Number,
    contact:Number,
    disease:String,
    date:Date,
    day:Number,
    address:String,
    prescription:String,
    doctor:String,
    ward:String,
    payment:Number,
    email:String,
    password:String,
});
const Patient = mongoose.model("Patient", patientSchema);
const doctorSchema  = new mongoose.Schema({
    name:String,
    email:String,
    address:String,
    password:String,
    contact_no:Number,
    specialization:String,
    salary:Number,
    appiontment: [patientSchema],
});
const Doctor = mongoose.model("Doctor",doctorSchema);

let data =[];
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:'Bhatsanaa8@gmail.com',
        pass: 'sanaa123@'
    }
});
const nexmo = new Nexmo({
    apiKey:'2d0e4503',
    apiSecret:'pQKHFw5cJ5o2bQPr',

});




app.get("/", function(req, res){
    res.render("home");
});
app.get("/login", function(req, res){
    res.render("login");
});
app.post("/login", (req, res)=>{
    if(req.body.email==="admin@gmail.com"&& req.body.password==="123"){
        res.render("admin");
    } else{
        Doctor.findOne({email:req.body.email},function(err, foundUser){
            if(foundUser){
                var y=1;
                if(foundUser.password===req.body.password){
                    Patient.find({doctor:foundUser.name}, function(err, pat){
                        // console.log(pat);
                        res.render("doctor",{pid:pat,x:y,found:foundUser});
                    })
                    
                }
            }
            
            else {
                Patient.findOne({email:req.body.email},function(err, found){
                  if(found){
                      if(found.password===req.body.password){
                        
                          res.render("patientView",{user:found});
                      }
                  }
                })
                // res.render("login")
            }
        })
    }
});
app.get("/addDoctor", function(req, res){
    var y = 1;
    Doctor.find({},function(err, docs){
        res.render("addDoctor",{doc:docs, dom:req.body,x:y});
    })
    
});
app.post("/addDoctor", (req, res)=>{
    if(req.body.hid===""){
        const doctor = new Doctor({
            name: req.body.name,
            email: req.body.email, 
            address: req.body.address,
            password: req.body.password,
            contact_no: req.body.contact,
            specialization: req.body.specialization,
            salary: req.body.salary,

    
        });
        doctor.save(function(err){
            if(!err){
                console.log("inserted successfully!");
                
                res.redirect("/addDoctor");
            }
        })
    } else{
        console.log(req.body.hid);
        Doctor.findByIdAndUpdate({_id:req.body.hid},req.body,{new:true}, function(err, docs){
            console.log("updated successfully");
            res.redirect("/addDoctor");
        })
    }
    
});

app.get("/addDoctor/:id", (req, res)=>{
    // console.log(req.params.id);
    var y=1;
    Doctor.find({}, function(err, doms){
        Doctor.findById({_id:req.params.id}, function(err, docs){
            res.render("addDoctor",{doc:doms, dom:docs,x:y})
        })
    })
    
});
app.get("/addDoctor/del/:id", (req, res)=>{
   Doctor.findByIdAndDelete({_id:req.params.id}, function(err, docs){
       if(!err){
           console.log("deleted successfully");
           res.redirect("/addDoctor");
       }
   })
});

app.get("/addPatient", (req, res)=>{
    var y=1;
    Patient.find({}, function(err, pat){
        Doctor.find({}, function(err, docs){
            res.render("addPatient",{doc:docs,pati:pat,x:y});
        });
    })     
});
app.post("/addPatient", (req, res)=>{
    const patient = new Patient({
        name:req.body.name,
        age:req.body.age,
        contact:req.body.contact,
        disease:req.body.disease,
        date:req.body.date,
        day: new Date(req.body.date).getDate(),
        address:req.body.address,
        doctor:req.body.doctor,
        ward:req.body.ward,
        email: req.body.email,
    });
    console.log(patient.day);
    patient.save(function(err){
        if(!err){
            console.log("inserted successfully");
            res.redirect("/addPatient")
        }
    })
});

app.get("/discharge",(req, res)=>{
    var y = 1;
        Patient.find({}, function(err, docs){
        res.render("discharge",{doc:docs,dam:"",x:y,datas:data})
    })
});
app.get("/discharge/:id",function(req, res){
    var y = 1;
    var today = new Date();
    today = today.getDate();     
        Patient.findById({_id:req.params.id}, function(err, docs){
             var date1 = docs.day;
             var dif = parseInt(today) - parseInt(date1);
             var payment1 = dif * 500;
              let arr = {
                days:dif,
                payment: payment1
             };
            data.push(arr);
            if(!err){
                res.render("bill", {doc:docs,datas:data})
            }
        })  
    });
    app.post("/bill/:id", function(req, res){
        console.log(req.body);
        console.log(req.params.id);
        console.log(parseInt(req.body.payment)+parseInt(req.body.extra));
       var ppp = parseInt(req.body.payment)+parseInt(req.body.extra);
        var update = {
            payment:ppp,
        }
        
        Patient.findByIdAndUpdate({_id:req.params.id},update,{new:true}, function(err, docs){
            if(!err){
                res.render("crm.ejs",{datas:docs},function(err, html){
                    console.log(docs);
                    pdf.create(html, options).toFile("./public/pdf/businesscard.pdf",function(err, res){
                        if(err){
                            console.log(err);
                        } else{
                            console.log(res);
                        }
                    });
                    res.send(html);
                })
            }
        })
        
    })
app.get("/download", function(req, res){
    res.download(file, function(err){
        if(!err){
            console.log("success");
        } else{
            console.log(err);
        }
    })
});
app.get("/prescription/:id", function(req, res){
    // console.log(req.params.id);
    Patient.findById({_id:req.params.id}, function(err, user){
        if(!err){
            // console.log(user);
            res.render("prescription", {patient:user})
        }
    })
    
});
app.post("/prescription/:id", function(req, res){
    // console.log(req.body);
    console.log(req.params.id);
    const mailOption={
        from: 'Bhatsanaa8@gmail.com',
        to: req.body.email,
        subject: 'sending email for test purpose',
        text: `hi`+req.body.prescription,
    };
    transporter.sendMail(mailOption, function(err, info){
        if(err){
            console.log(err);
        } else{
            console.log("email sent: "+ info.response);
        }
    });
    

    Patient.findByIdAndUpdate({_id:req.params.id},req.body,{new:true}, function(err, user){
        if(!err){
            var y = 1;
            Patient.find({doctor:req.body.doctor}, function(err, pat){
                console.log("user", user);
                Doctor.findOne({name:user.doctor},(err, doctor)=>{
                    console.log("doctor",doctor);
                    res.render("doctor",{pid:pat,x:y,found:doctor})
                })
               
            })
       
        }
    })
});
app.get("/sms/:id", function(req, res){
    const from = 'Vonage APIs';
    const to = '919596936138';
    const text = 'hello from danish';
    nexmo.message.sendSms(from, to, text);
    console.log(req.params.id);
    Patient.findById({_id:req.params.id}, function(err, user){
        console.log(user.doctor);
        if(!err){
            var y = 1;
            Patient.find({doctor:user.doctor}, function(err, pat){
                Doctor.findOne({name:user.doctor}, (err, doctor)=>{
                    res.render("doctor",{pid:pat,x:y, found:doctor})
                })
               
            })
       
        }
    })
    
});
app.get("/register", function(req, res){
    res.render("register");
});
app.post("/register", function(req, res){
    // console.log(req.body);
    const patient = new Patient({
        name: req.body.name,
        age: req.body.age,
        contact: req.body.contact,
        address: req.body.address,
        email: req.body.email,
        disease: req.body.disease,
        password: req.body.password,
        date:req.body.date,
    });
    patient.save(function(err){
        if(err){
            console.log(err);
        } else{
            res.redirect("/login");
        }
    })
});

app.get("/near/:id", function(req, res){
    var y = 1;
    // console.log(req.params.id);
    Patient.findById({_id:req.params.id}, function(err, found){
        Doctor.find({address:found.address}, function(err, user){
            // console.log(user);
            res.render("nearDoctor",{users:user,x:y,founds:found, message:''});
        })

    })
});
app.get("/appiontment/:id/:ids", function(req, res){
    var y = 1;
    console.log(req.params.id);
    console.log(req.params.ids);
    var update = {};
    Patient.findById({_id:req.params.id}, function(err, user){
        //  update.appiontment = user;
         Doctor.findOne({_id:req.params.ids},function(err, usr){
            
            if(usr){
                usr.appiontment.push(user);
                usr.save(function(err){
                    if(!err){
                        console.log(usr);
                        Doctor.find({address:user.address}, (err, doctors)=>{
                            res.render("nearDoctor",{users:doctors,x:y,founds:user, message:'Appointment fixed successfully, date and time will be forwarded via email/sms '});
                        })
                        

                    }
                })
               
            }
        })
    })
    
    
});
app.get("/appiontments/:id", function(req, res){
    var y = 1;
    // console.log(req.params.id);
    Doctor.findById({_id:req.params.id}, function(err, doc){
        console.log(req.params.id);
        console.log(doc.appiontment);
        res.render("appointments",{docs:doc.appiontment,x:y})
    })
});
app.get("/bmi", function(req, res){
    res.render("bmi")
});
app.post("/bmi", function(req, res){
    var weight = req.body.weight;
    var height = parseFloat(req.body.height)* 0.3048;
    console.log(height);
   var bmi = parseFloat(weight)/parseFloat(height*height);
   var result =  Math.round(bmi*10)/10;
   console.log("your BMI is: "+result);
   if(bmi>18.5&&bmi<25){
       console.log("you are normal");
       res.render("bmiCal",{normal:"your BMI is: "+result+", indicating your weight is in the Normal Category"})
   }else if(bmi<18.5){
       console.log("you are underweight");
       res.render("bmiCal",{normal:"your BMI is: "+result+", indicating your weight is in the UnderWeight Category"})
   }else{
       console.log("you are over weight");
       res.render("bmiCal",{normal:"your BMI is: "+result+", indicating your weight is in the OverWeight Category"})
   }


});
app.get("/speacialist", function(req, res){
    res.render("specialist")
});
app.get("/contact", function(req, res){
    res.render("contactUs")
})

app.get("/caloriesCal", (req, res)=>{
    res.render("calories");
})

app.get("/insolineCal",(req, res)=>{
    res.render("insolineCal");
});

//port
app.listen(3000, function(){
    console.log("server is running on port 3000");
})