import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-blog-details',
    imports: [CommonModule],
    templateUrl: './blog-details.html',
    styleUrl: './blog-details.css'
})
export class BlogDetails implements OnInit {
    postId: number | null = null;
    post: any = null;

    // Ideally this should come from a service
    blogPosts = [
        {
            id: 1,
            title: "The Power of Hoarding Advertising in 2025",
            image: "assets/billboardimg.jpg",
            category: "Trends",
            date: "Dec 15, 2025",
            author: "AdOnStreet Team",
            content: `
        <p>In an age dominated by digital screens, the tangible impact of hoarding advertising remains undeniable. As we move into 2025, the strategic placement of large-format outdoor media continues to offer unparalleled brand visibility.</p>
        <h3>Why Hoardings Still Matter</h3>
        <p>Unlike digital ads that can be skipped or blocked, hoardings are always on. They dominate the visual landscape and provide 24/7 exposure to a diverse audience. High-traffic junctions in metropolitan cities serve as prime real estate for brands looking to make a bold statement.</p>
        <h3>Integrating Tech with Tradition</h3>
        <p>Modern hoardings are evolving. With the integration of QR codes and augmented reality (AR) triggers, static billboards are becoming interactive touchpoints. This hybrid approach bridges the gap between offline awareness and online conversion.</p>
        <p>Furthermore, data-driven location planning allows advertisers to target specific demographics more effectively than ever before.</p>
      `,
            tags: ["Outdoor Media", "Advertising Trends", "Branding"]
        },
        {
            id: 2,
            title: "Digital LED vs. Traditional Billboards",
            image: "assets/digitalscreen.jpg",
            category: "Technology",
            date: "Dec 10, 2025",
            author: "Sarah Jenkins",
            content: `
        <p>The debate between Digital LED screens and traditional static billboards is clearer than ever. Each medium serves a distinct purpose in a comprehensive marketing strategy.</p>
        <h3>The Case for Digital LED</h3>
        <p>Digital screens offer flexibility. Advertisers can run multiple creatives, schedule ads for specific times of the day, and use motion to catch the eye. They are perfect for time-sensitive promotions and storytelling.</p>
        <h3>The Strength of Static Billboards</h3>
        <p>Static billboards provide 100% share of voice. There is no rotating slot; your brand owns the space exclusively. This constant presence builds strong subconscious recall over time.</p>
        <p>Ultimately, the choice depends on your campaign goals: reach and retention (Static) vs. engagement and flexibility (Digital).</p>
      `,
            tags: ["LED Screens", "Billboards", "Marketing Strategy"]
        },
        {
            id: 3,
            title: "Maximizing ROI with Vehicle Branding",
            image: "assets/vehicleimg.jpg",
            category: "Transit Media",
            date: "Nov 28, 2025",
            author: "Mike Ross",
            content: `
        <p>Vehicle branding turns everyday traffic into a marketing opportunity. From delivery vans to public buses, transit media offers one of the lowest costs per impression (CPM) in the industry.</p>
        <h3>Mobile Billboards</h3>
        <p>A branded vehicle travels through various neighborhoods, reaching audiences that static billboards might miss. It is non-intrusive yet highly visible branding that moves where your customers are.</p>
        <h3>Cost-Effective & Long-Lasting</h3>
        <p>A high-quality vehicle wrap can last for years, providing continuous advertising with a one-time investment. For local businesses, this is an incredibly efficient way to build community presence.</p>
      `,
            tags: ["Vehicle Branding", "ROI", "Transit Ads"]
        },
        {
            id: 4,
            title: "Why Wall Painting Works for Rural Marketing",
            image: "assets/wall-img.jpg",
            category: "Rural Marketing",
            date: "Nov 20, 2025",
            author: "Priya Sharma",
            content: `
        <p>In rural and semi-urban areas, digital penetration may still be growing, but physical walls are everywhere. Wall painting is a traditional yet powerful medium for hyperlocal branding.</p>
        <h3>Cultural Connection</h3>
        <p>Wall paintings often blend with local aesthetics, making the brand feel like part of the community. They are perceieved as less intrusive and more permanent than paper posters.</p>
        <h3>High Recall</h3>
        <p>Strategic placement near village squares, markets, and highways ensures that the brand message is seen repeatedly by the local population, driving high recall for FMCG, agriculture, and telecom brands.</p>
      `,
            tags: ["Rural Marketing", "Wall Painting", "Hyperlocal"]
        }
    ];

    constructor(private route: ActivatedRoute) { }

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            this.postId = Number(params.get('id'));
            this.post = this.blogPosts.find(p => p.id === this.postId);
        });
    }
}
