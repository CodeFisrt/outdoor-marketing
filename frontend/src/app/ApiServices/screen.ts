import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Screen {
  
  constructor(private http:HttpClient){

  };

  getAllScreen=()=>{
    return this.http.get("http://localhost:8080/screens")
  };
  addNewScreen=(obj:any)=>{
    return this.http.post("http://localhost:8080/screens",obj);
  };
  updateScreenbyId=(id:any,obj:any)=>{
    return this.http.put("http://localhost:8080/screens/"+id,obj);
  };
  deleteScreenById=(id:any)=>{
    return this.http.delete("http://localhost:8080/screens/"+id)
  }
}
