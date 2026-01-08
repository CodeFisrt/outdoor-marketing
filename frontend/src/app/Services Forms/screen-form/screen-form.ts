import { CommonModule, NgClass, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Route, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { SeoService } from '../../ApiServices/Seo-Service/seo-service';
import { features } from 'node:process';
import { log } from 'node:console';


@Component({
  selector: 'app-screen-form',
  imports: [NgClass, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './screen-form.html',
  styleUrl: './screen-form.css'
})
export class ScreenForm {
  screenForm!: FormGroup;
  selectedScreenId: number = 0; // 0 = new screen, otherwise edit
  ;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private toaster: ToastrService,
    private fb: FormBuilder,
    private seo: SeoService
  ) { }

  ngOnInit(): void {
    this.initForm();
    //to react activated route id
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.selectedScreenId = +idParam;
        if (this.selectedScreenId !== 0) {
          this.loadScreenData(this.selectedScreenId);
        }
      }
    });
    this.seo.updateSeo({
      title: 'Outdoor Advertising & Billboard Booking Platform in India',
      description: 'Find and book outdoor advertising like billboards, digital screens, vehicle and street ads across India with location-based search.',
      keywords: 'outdoor advertising, billboard advertising, digital screen advertising, hoarding ads, vehicle branding, street advertising, outdoor media booking, billboard booking platform, advertising in India',
      canonical: 'https://adonstreet.com/dashboard/digitalscreen/edit/' + this.selectedScreenId,
      robots: 'NOINDEX, NOFOLLOW',
      author: 'CodingEra',
      publisher: 'Adonstreet',
      lang: 'en-IN'
    })
  }


  // Initialize the form
  initForm() {
    this.screenForm = this.fb.group({
      ScreenName: ['', Validators.required],
      Location: ['', Validators.required],
      City: ['', Validators.required],
      State: ['', Validators.required],
      Latitude: [null, Validators.required],
      Longitude: [null, Validators.required],
      ScreenType: ['', Validators.required],
      Size: ['', Validators.required],
      Resolution: ['', Validators.required],
      OwnerName: ['', Validators.required],
      ContactPerson: ['', Validators.required],
      ContactNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      OnboardingDate: ['', Validators.required],
      Status: ['Active', Validators.required],
      RentalCost: [0, Validators.required],
      ContractStartDate: ['', Validators.required],
      ContractEndDate: ['', Validators.required],
      PowerBackup: [false],
      InternetConnectivity: ['', Validators.required],
      Notes: [''],
      featured: [false]
    });
  }
  //load Edit
  loadScreenData(id: number) {
    this.http.get<any>(`http://localhost:8080/screens/${id}`).subscribe({
      next: (data) => {
        this.screenForm.patchValue({
          ...data,
          OnboardingDate: data.OnboardingDate?.split('T')[0],
          ContractStartDate: data.ContractStartDate?.split('T')[0],
          ContractEndDate: data.ContractEndDate?.split('T')[0],
          featured: data.featured === 1
        });
        console.log(data);
      },
      error: () => {
        this.toaster.error("Failed to load vehicle details");
      }
    });
  }

  // Save new screen or update existing
  addOrUpdateScreen() {
    // const payload = this.screenForm.value;
    const payload = {
      ...this.screenForm.value,
      featured: this.screenForm.value.featured ? 1 : 0
    };

    if (this.selectedScreenId === 0) {
      // Create new screen
      this.http.post("http://localhost:8080/screens/", payload).subscribe({
        next: (res: any) => {
          this.toaster.success("New Screen Added Successfully");
          this.router.navigateByUrl("/dashboard/digitalscreen")
          this.screenForm.reset();
        },
        error: (err) => {
          console.error(err);
          this.toaster.error("Error Creating Screen");
        }
      });
    } else {
      // Update existing screen
      this.http.put(`http://localhost:8080/screens/${this.selectedScreenId}`, payload).subscribe({
        next: (res: any) => {
          this.toaster.success("Screen Updated Successfully");
          this.router.navigateByUrl("/dashboard/digitalscreen")
          this.screenForm.reset();
          this.selectedScreenId = 0; // reset to create mode
        },
        error: (err) => {
          console.error(err);
          this.toaster.error("Error Updating Screen");
        }
      });
    }
  }

  resetForm() {
    this.screenForm.reset();
    this.selectedScreenId = 0;
  }


}
