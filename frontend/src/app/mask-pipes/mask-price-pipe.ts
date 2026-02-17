import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'maskPrice',
  standalone: true   // keep this if using standalone component
})
export class MaskPricePipe implements PipeTransform {

  transform(value: number | string): string {
    if (value === null || value === undefined) return '';

    // Convert to number first (removes decimal part)
    const numericValue = Math.floor(Number(value));

    // If value is not a valid number
    if (isNaN(numericValue)) return '';

    const strValue = numericValue.toString();

    // If length is 2 or less, return as it is
    if (strValue.length <= 2) {
      return strValue;
    }

    const firstTwo = strValue.substring(0, 2);
    const masked = 'X'.repeat(strValue.length - 2);

    return firstTwo + masked;
  }

}


//  transform(value: number | string): string {
//     if (value === null || value === undefined) return '';

//     const numericValue = Math.floor(Number(value));

//     if (isNaN(numericValue)) return '';

//     // Convert to thousands format
//     const result = Math.floor(numericValue / 1000);

//     if (result <= 0) {
//       return numericValue.toString();
//     }

//     return result + 'K';
//   }

// }
