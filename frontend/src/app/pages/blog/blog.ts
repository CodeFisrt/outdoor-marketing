import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-blog',
  imports: [CommonModule, RouterModule],
  templateUrl: './blog.html',
  styleUrl: './blog.css'
})
export class Blog {
  blogPosts = [
    {
      id: 1,
      title: "The Power of Hoarding Advertising in 2025",
      image: "assets/billboardimg.jpg",
      category: "Trends",
      date: "Dec 15, 2025",
      author: "AdOnStreet Team",
      description: "Discover why traditional hoarding advertising remains a dominant force in building brand awareness despite the digital boom."
    },
    {
      id: 2,
      title: "Digital LED vs. Traditional Billboards",
      image: "assets/digitalscreen.jpg",
      category: "Technology",
      date: "Dec 10, 2025",
      author: "Sarah Jenkins",
      description: "A comprehensive comparison to help you decide which medium suits your campaign goals better: static impact or dynamic motion."
    },
    {
      id: 3,
      title: "Maximizing ROI with Vehicle Branding",
      image: "assets/vehicleimg.jpg",
      category: "Transit Media",
      date: "Nov 28, 2025",
      author: "Mike Ross",
      description: "Turn traffic jams into marketing opportunities. Learn how vehicle wraps can deliver thousands of impressions daily at low cost."
    },
    {
      id: 4,
      title: "Why Wall Painting Works for Rural Marketing",
      image: "assets/wall-img.jpg",
      category: "Rural Marketing",
      date: "Nov 20, 2025",
      author: "Priya Sharma",
      description: "In areas where digital reach is limited, discover how artistic wall locations create lasting brand recall in communities."
    }
  ];

  constructor() { }
}
