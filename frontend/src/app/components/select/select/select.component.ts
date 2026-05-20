import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css'
})
export class SelectComponent implements OnChanges {

  @Input() data:any
  @Input() label:string=""
  @Input() textsize:string="text-xs"
  @Input() value:string=""
  @Input() disabled:boolean=false
  @Input() blankline:boolean=false
  @Output() setSelectValue = new EventEmitter<any>();

  items: any[] = [];
  selectedvalue:string=""

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['value']) {
      this.updateItems();
    }
  }

  updateItems() {
    // console.log("updateItems",this.label,this.data,this.value)
    this.items = this.data;
    this.selectedvalue = this.value;
  }

  setValue(e: any,label:string) {
    // console.log("targetvalue",e.target.value,this.data)
    let val=this.data.find((f:any)=>f.value.toString()==e.target.value.toString())
    // console.log("val",val,this.value)
    this.setSelectValue.emit({value:val?val.value:"",label:label});
  }

  textSizeClass(size:string){
    return size 
  }
}
