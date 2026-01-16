import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import jsPDF from 'jspdf';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Signupservice } from '../../ApiServices/signupservice';
import { RouterLink, RouterModule } from "@angular/router";

@Component({
  selector: 'app-case-study-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './case-study-form.html',
  styleUrls: ['./case-study-form.css']
})
export class CaseStudyFormComponent {

  caseStudyForm: FormGroup;

  pdfUrl: string | null = null;
  safePdfUrl: SafeResourceUrl | null = null;

  showPdfActions = false;
  showPreview = false;

  constructor(
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    public signupservice: Signupservice
  ) {
    this.caseStudyForm = this.fb.group({
      clientName: ['', Validators.required],
      campaignObjective: ['', Validators.required],
      areaName: ['', Validators.required],
      city: ['', Validators.required],
      crowdFootfall: ['', Validators.required],
      nearbyCompanies: ['', Validators.required],
      boardDistance: ['', Validators.required],
      roadType: ['', Validators.required],
      trafficCount: ['', Validators.required],
      nightVisibility: ['', Validators.required],
      illuminationType: ['', Validators.required],
      previousAds: ['', Validators.required],
      boardSize: ['', Validators.required],
      campaignDuration: ['', Validators.required],
      results: ['', Validators.required],
      conclusion: ['', Validators.required]
    });
  }

  generatePDF() {
    if (this.caseStudyForm.invalid) {
      this.caseStudyForm.markAllAsTouched();
      return;
    }

    const pdf = new jsPDF();

    let y = 15;
    pdf.setFontSize(16);
    pdf.text('Outdoor Hoarding Case Study', 105, y, { align: 'center' });
    y += 12;

    pdf.setFontSize(11);

    const data = this.caseStudyForm.value;

    const addField = (label: string, value: string) => {
      pdf.text(label + ':', 10, y);
      y += 6;
      pdf.text(value || '-', 10, y);
      y += 8;
    };

    addField('Client Name', data.clientName);
    addField('Campaign Objective', data.campaignObjective);
    addField('Area Name', data.areaName);
    addField('City', data.city);
    addField('Total Crowd (5 km Radius)', data.crowdFootfall);
    addField('Nearby Companies', data.nearbyCompanies);
    addField('Distance from Main Road', data.boardDistance);
    addField('Road Type', data.roadType);
    addField('Traffic Count', data.trafficCount);
    addField('Night Visibility', data.nightVisibility);
    addField('Illumination Type', data.illuminationType);
    addField('Previous Ads', data.previousAds);
    addField('Board Size', data.boardSize);
    addField('Campaign Duration', data.campaignDuration);
    addField('Results', data.results);
    addField('Conclusion', data.conclusion);

    const blob = pdf.output('blob');
    this.pdfUrl = URL.createObjectURL(blob);
    this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfUrl);

    this.showPdfActions = true;
    this.showPreview = false;
  }

  viewPDF() {
    this.showPreview = true;
  }

  closePreview() {
    this.showPreview = false;
  }

  downloadPDF() {
    if (!this.signupservice.canDownloadPdf()) {
      return;
    }

    if (!this.pdfUrl) return;

    const link = document.createElement('a');
    link.href = this.pdfUrl;
    link.download = 'Outdoor-Hoarding-Case-Study.pdf';
    link.click();
  }
}
