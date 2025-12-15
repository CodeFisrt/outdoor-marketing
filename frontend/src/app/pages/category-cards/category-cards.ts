import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CategoryCard {
    title: string;
    description: string;
    image: string;
    gradient: string;
    icon: string;
}

@Component({
    selector: 'app-category-cards',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './category-cards.html',
    styleUrl: './category-cards.css'
})
export class CategoryCards {
    categories: CategoryCard[] = [
        {
            title: 'Hoarding',
            description: 'Large format outdoor billboards',
            image: 'assets/billboardimg.jpg',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            icon: '🏗️'
        },
        {
            title: 'Vehicle Marketing',
            description: 'Mobile advertising solutions',
            image: 'assets/vehicleimg.jpg',
            gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            icon: '🚗'
        },
        {
            title: 'Digital Marketing',
            description: 'LED screens & digital displays',
            image: 'assets/digitalscreen.jpg',
            gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            icon: '💻'
        },
        {
            title: 'Poll Kiosk',
            description: 'Interactive outdoor booths',
            image: 'assets/streetimg.jpg',
            gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            icon: '🗳️'
        },
        {
            title: 'Wall Painting',
            description: 'Artistic wall murals & branding',
            image: 'assets/wall-img.jpg',
            gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            icon: '🎨'
        }
    ];

    @Output() categorySelected = new EventEmitter<string>();

    onCardClick(category: CategoryCard) {
        console.log('Category clicked:', category.title);
        this.categorySelected.emit(category.title);
    }
}
