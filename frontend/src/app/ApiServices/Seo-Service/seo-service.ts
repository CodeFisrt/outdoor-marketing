import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';



@Injectable({
  providedIn: 'root'
})
export class SeoService {

  constructor(
    private titleService: Title,
    private metaService: Meta,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  updateSeo(data: {
    title: string;
    description: string;
    keywords?: string;
    canonical?: string;
    robots?: string;
    author?: string;
    publisher?: string;
    lang?: string;
  }) {

    /* ✅ Page Title (SSR SAFE) */
    this.titleService.setTitle(data.title);

    /* ✅ Meta Tags (SSR SAFE) */
    this.metaService.updateTag({ name: 'description', content: data.description });

    if (data.keywords) {
      this.metaService.updateTag({ name: 'keywords', content: data.keywords });
    }

    if (data.robots) {
      this.metaService.updateTag({ name: 'robots', content: data.robots });
    }

    if (data.author) {
      this.metaService.updateTag({ name: 'author', content: data.author });
    }

    if (data.publisher) {
      this.metaService.updateTag({ name: 'publisher', content: data.publisher });
    }

    /* ✅ Browser-only DOM operations */
    if (isPlatformBrowser(this.platformId)) {

      /* Canonical URL */
      if (data.canonical) {
        let link = this.document.querySelector("link[rel='canonical']") as HTMLLinkElement;

        if (!link) {
          link = this.document.createElement('link');
          link.setAttribute('rel', 'canonical');
          this.document.head.appendChild(link);
        }

        link.setAttribute('href', data.canonical);
      }

      /* Language */
      if (data.lang) {
        this.document.documentElement.lang = data.lang;
      }
    }
  }

 }
