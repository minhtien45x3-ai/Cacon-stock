let state={
journal:[],
library:[],
quiz:[]
}



function switchTab(id){

document.querySelectorAll(".tab").forEach(t=>t.classList.add("hidden"))

document.getElementById(id).classList.remove("hidden")

}



function changeTheme(theme){

document.body.className=theme

}



function updateMarket(){

let d=document.getElementById("distDays").value

let text=""

if(d<=2) text="Market bình thường"

else if(d==3) text="Market rủi ro"

else if(d==4) text="Giảm tỷ trọng"

else text="Về tiền mặt"

document.getElementById("marketStatus").innerText=text

}



document.getElementById("slider-range").addEventListener("input",e=>{

document.querySelector(".overlay").style.width=e.target.value+"%"

})



document.getElementById("uploadChart").addEventListener("change",function(){

let reader=new FileReader()

reader.onload=e=>{

document.getElementById("realChart").src=e.target.result

}

reader.readAsDataURL(this.files[0])

})



function calcRR(){

let entry=parseFloat(entryPrice.value)

let stop=parseFloat(stopPrice.value)

let risk=entry-stop

let target=entry+risk*2

rrResult.innerText="Target 2R: "+target

}



function openLibraryModal(){

let title=prompt("Tiêu đề")

let content=prompt("Nội dung")

state.library.push({title,content})

renderLibrary()

}



function renderLibrary(){

let html=""

state.library.forEach((b,i)=>{

html+=`

<div onclick="showArticle(${i})">

${b.title}

</div>

`

})

libraryList.innerHTML=html

}



function showArticle(i){

libraryContent.innerText=state.library[i].content

}



function startQuiz(){

let q=state.quiz[0]

quizBox.innerHTML=q

}



function initChart(){

const ctx=document.getElementById('equityChart')

new Chart(ctx,{

type:'line',

data:{
labels:['1','2','3','4'],
datasets:[{
data:[1,3,2,5],
borderColor:'lime'
}]
}

})

}



initChart()