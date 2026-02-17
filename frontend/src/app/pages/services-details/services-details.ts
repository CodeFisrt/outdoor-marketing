import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-services-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './services-details.html',
  styleUrl: './services-details.css'
})
export class ServicesDetails implements OnInit {

  service: any;

  services = [
    {
      id: 1,
      title: "Hoarding Advertising",
      image: "assets/billboardimg.jpg",
      fullDescription: "Our hoarding advertising provides large-scale brand visibility at premium highway and city locations with 24/7 exposure.The primary strength of hoarding advertising lies in its scale and placement. Because these structures are large and positioned in high-traffic zones, they naturally attract attention from commuters, pedestrians, and daily travelers. Unlike digital ads that depend on user interaction or algorithms, hoardings provide uninterrupted exposure 24 hours a day, ensuring continuous brand visibility From a marketing theory perspective, hoarding advertising works on the principle of repetition and dominance. When audiences repeatedly view the same advertisement during their daily commute, it builds familiarity. Over time, familiarity develops into trust, and trust influences purchasing decisions. The physical presence of a large-format display also enhances perceived brand authority, positioning the brand as established and credible.",
      keyFeatures: [
      {
        title: "Large-Scale Visibility",
        content: "Hoardings are massive display structures, ensuring your message is clearly visible from long distances."
      },
      {
        title: "24/7 Brand Exposure",
        content: "Unlike digital ads that depend on screen time, hoardings provide uninterrupted visibility day and night."
      },
      {
        title: "Strategic Locations",
        content: "Placed in high-traffic and premium locations for maximum audience reach.",
        locations: [
          "Highways",
          "Major city junctions",
          "Commercial hubs",
          "Residential zones",
          "Shopping districts"
        ]
      }
    ],
  },
  {
  id: 2,
  title: "Pole Kiosk Branding",
  image: "assets/streetimg.jpg",
  fullDescription: "Pole kiosk branding is an effective outdoor advertising medium that ensures repeated brand exposure across busy urban streets and marketplaces. Installed on electric poles and streetlight poles, these compact yet high-frequency displays capture the attention of pedestrians, commuters, and local shoppers. Because they appear in continuous sequences along roads, they reinforce brand recall through repetition. From a marketing theory perspective, pole kiosk branding works on the principle of frequency and visual dominance within a localized area. Repeated daily exposure strengthens memory retention and improves brand familiarity. This method is especially powerful for local promotions, retail campaigns, political awareness drives, and event marketing where geographic targeting is essential.",
  keyFeatures: [
    {
      title: "High-Frequency Exposure",
      content: "Multiple pole kiosks placed in a sequence ensure repeated visibility throughout the commute."
    },
    {
      title: "Localized Targeting",
      content: "Ideal for targeting specific neighborhoods, markets, and commercial streets."
    },
    {
      title: "Cost-Effective Outdoor Media",
      content: "Affordable advertising option with strong impact in urban and semi-urban areas."
    }
  ]
},
{
  id: 3,
  title: "Vehicle Advertising",
  image: "assets/vehicleimg.jpg",
  fullDescription: "Vehicle advertising transforms moving vehicles into powerful mobile billboards that travel across the city, expanding brand reach beyond fixed locations. Whether applied to buses, vans, autos, or delivery vehicles, this advertising format ensures dynamic visibility in high-traffic zones. Unlike static billboards, vehicle ads move with the audience, reaching multiple demographics throughout the day. From a marketing strategy perspective, vehicle advertising operates on mobility and extended geographic coverage. It increases impressions by covering diverse routes and locations, maximizing exposure. The continuous movement enhances curiosity and attracts attention, making it an impactful solution for brand awareness campaigns and product launches.",
  keyFeatures: [
    {
      title: "Mobile Brand Visibility",
      content: "Your brand travels across the city, reaching diverse audiences daily."
    },
    {
      title: "Wide Geographic Coverage",
      content: "Covers multiple routes and high-traffic areas for maximum exposure."
    },
    {
      title: "High Recall Value",
      content: "Eye-catching vehicle wraps create lasting visual impressions."
    }
  ]
},
{
  id: 4,
  title: "Wall Painting",
  image: "assets/wall-img.jpg",
  fullDescription: "Wall painting advertising creates strong brand presence in rural, semi-urban, and developing areas where traditional digital media has limited reach. This format uses artistic visuals and bold typography painted directly on building walls to ensure long-term visibility. Because wall paintings remain in place for extended periods, they provide continuous brand reinforcement. From a marketing theory standpoint, wall painting leverages permanence and community familiarity. As residents pass by the same location daily, the brand message becomes deeply embedded in their memory. This method is particularly effective for regional brands, FMCG products, public awareness campaigns, and rural outreach programs.",
  keyFeatures: [
    {
      title: "Long-Term Visibility",
      content: "Provides extended exposure without recurring digital costs."
    },
    {
      title: "Strong Rural Impact",
      content: "Highly effective in villages and semi-urban communities."
    },
    {
      title: "Artistic Brand Representation",
      content: "Creative wall art enhances emotional connection with the audience."
    }
  ]
},
{
  id: 5,
  title: "Digital LED Screens",
  image: "assets/digitalscreen.jpg",
  fullDescription: "Digital LED screen advertising delivers high-impact, dynamic content in prime commercial and urban locations. Unlike traditional static billboards, LED screens allow video, animation, and rotating advertisements that capture attention instantly. Positioned in high-footfall zones such as malls, city centers, and traffic junctions, digital screens maximize engagement through vibrant visuals and motion graphics. From a marketing theory perspective, digital LED advertising operates on the principles of motion attraction and dynamic storytelling. Movement naturally draws human attention, increasing message retention and brand recall. This format is ideal for product launches, real-time promotions, brand campaigns, and high-end corporate advertising.",
  keyFeatures: [
    {
      title: "Dynamic Visual Impact",
      content: "Supports video, animation, and multiple ad rotations."
    },
    {
      title: "Prime Urban Locations",
      content: "Installed in high-footfall commercial hubs and junctions."
    },
    {
      title: "High Engagement Rate",
      content: "Motion-based content captures attention more effectively than static displays."
    }
  ]
}
    // {
    //   id: 2,
    //   title: "Pole Kiosk Branding",
    //   image: "assets/streetimg.jpg",
    //   fullDescription: "Pole kiosk branding ensures repeated exposure across urban streets, increasing brand memory and recall."
    // },
    // {
    //   id: 3,
    //   title: "Vehicle Advertising",
    //   image: "assets/vehicleimg.jpg",
    //   fullDescription: "Vehicle advertising turns city traffic into marketing opportunities using branded mobile media."
    // },
    // {
    //   id: 4,
    //   title: "Wall Painting",
    //   image: "assets/wall-img.jpg",
    //   fullDescription: "Wall painting advertising builds strong rural and semi-urban brand presence with artistic visuals."
    // },
    // {
    //   id: 5,
    //   title: "Digital LED Screens",
    //   image: "assets/digitalscreen.jpg",
    //   fullDescription: "Digital LED screens deliver high-impact dynamic advertising at prime commercial hubs."
    // }
  ]


  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.service = this.services.find(s => s.id === id);
    });
  }

}
