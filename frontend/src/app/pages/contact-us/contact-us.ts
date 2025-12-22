import { Component } from '@angular/core';
import { ContactService } from './contact-service/contact-service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { error } from 'console';

@Component({
  selector: 'app-contact-us',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-us.html',
  styleUrl: './contact-us.css'
})
export class ContactUs {

  formData ='';
  contactForm!:FormGroup;
  constructor(private fb:FormBuilder,
    private contactSrv:ContactService){
      this.contactForm= this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
       })
    }

    onSubmit(){
      if(this.contactForm.invalid){
        alert("Please Fill Required Fields");
        return
      }

      this.contactSrv.sendContactForm(this.contactForm.value).subscribe({
        next:(res)=>{
          debugger
          this.formData = res;
          console.log("Formdata added successfully")
          // this.contactForm.reset();
          this.contactSrv.sendMail(this.contactForm.value).subscribe({
            next:()=>{
              alert("Mail Sent Successfully");
              this.contactForm.reset();
            },
            error:(err)=>{
              console.error("Mail Error:",err)
               console.log("Server error body", err.error);
              alert(err.error?.error || "Mail failed")
              // alert("Db save, but mail not sent")
            }
          })
        },
        error:(err)=>{
          console.error("contactform Error:",err);
          alert("Something went to wrong")
        }
      })
    }



}
