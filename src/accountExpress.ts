import express from "express";
import * as fs from "fs";
import * as path from "path";
import { TOKEN_LIST } from './constants';


var app = express();


app.get('/', function(req, res){      

    var i:number;  

    const fsfile = fs.readFileSync( path.join(__dirname, 'accounts', `index.json`))

    const nextId = JSON.parse(fsfile.toString()).nextId
  
    var html = "";  

    html += '<p><br/>' + 
    '<p>The most HOT unhealthy accounts on AAVE Avalanche</p>' +
    '<p>Liquidate it !!<p/><br/>'
    '</p><br/>';
      
    for ( i = nextId-1; i > 0; i-- ) {

        var data = fs.readFileSync (path.join(__dirname, 'accounts',`account${i}.json`))
    
        const dataJ = JSON.parse(data.toString());     
        
        var collacteral = `<a href=https://snowtrace.io/address/${dataJ.value.max_collacteral}>`+ TOKEN_LIST[ dataJ.value.max_collacteral ].symbol +"</a>"
        var reserve = `<a href=https://snowtrace.io/address/${dataJ.value.max_reserve}>`+ TOKEN_LIST[ dataJ.value.max_reserve ].symbol +"</a>"

        html += '<p>' + 
        '<p>Time: ' + dataJ.time + '</p>' +
        '<p>User account: ' + dataJ.user_id + '</p>' +
        '<p>Collacteral : \t' + collacteral + '</p>' +
        '<p>Amount : \t' + dataJ.value.max_collacteralAmount + '</p>' +
        '<p>Reserve : \t' + reserve + '</p>' +
        '<p>Amount : \t' + dataJ.value.max_reserveAmount + '</p>' +
        '</p><br/>';     
        
    }
    res.send(html);
    
})


console.log("Server started http://localhost:4503");
app.listen(4503);