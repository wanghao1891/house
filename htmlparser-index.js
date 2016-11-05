const request = require('request');
const htmlparser = require("htmlparser");
const co = require('co');
const chalk = require('chalk');

let urls = [
    'http://bj.lianjia.com/ershoufang/hu1co42rs%E5%8C%97%E8%A1%97%E5%AE%B6%E5%9B%AD/',
    'http://bj.lianjia.com/ershoufang/hu1pg2co42rs%E5%8C%97%E8%A1%97%E5%AE%B6%E5%9B%AD/',
    'http://bj.lianjia.com/ershoufang/hu1pg3co42rs%E5%8C%97%E8%A1%97%E5%AE%B6%E5%9B%AD/'
];

let html_list = [];

let house_list = [];

function do_request(url) {
    return new Promise((resolve, reject) => {
        console.log(chalk.green(url));
        request(url, function (error, response, body) {
            if(!error && response.statusCode == 200) {
                html_list.push(body);
                resolve();
            } else {
                reject({
                    error: error
                });
            }
        });
    });
}

co(function *() {
    for(let url of urls) {
        var result =  yield do_request(url);
        //console.log(JSON.stringify(result, null, 2));
        //console.log(result.stdout);
    }
})
    .then((val) => {
        console.log('Done!', val ? val : '');
        console.log(html_list);

        for(let html of html_list) {
            do_parse(html);
        }

        console.log(house_list);
        console.log(house_list.length);
    })
    .catch(
        (error) => {
            console.log(error);
            console.log('Failed!');
        }
    );

console.log('html_list', html_list);

//for(let url of urls) {
//    request(url, function (error, response, body) {
//        if (!error && response.statusCode == 200) {
//            house_list.push(body);
//            //console.log(body); // Show the HTML for the Google homepage.
//            //var rawHtml = "Xyz <script language= javascript>var foo = '<<bar>>';< /  script><!--<!-- Waah! -- -->";
////            var handler = new htmlparser.DefaultHandler(function (error, dom) {
////                if(error){
////
////                } else {
////                    //console.log('dom:', dom);
////                }
////            });
////            var parser = new htmlparser.Parser(handler);
////            parser.parseComplete(body);
////            //console.log(JSON.stringify(handler.dom, null, 2));
////            console.log(handler.dom);
////            //        for(let e of handler.dom[1].children[1].children) {
////            //            if(e.raw == 'div class="content"') {
////            //                console.log(e.children[1].children);
////            //
////            //                for(let e1 of (e.children[1].children)) {
////            //                    if(e1.raw === 'ul class="listContent" log-mod="list"') {
////            //                        console.log(JSON.stringify(e1.children[0].children[1].children[5].children, null ,2));
////            //                    }
////            //                }
////            //            }
////            //        }
////            //console.log(handler.dom[1].children[1]);
////
////            function get_data(children) {
////                for(let e of children) {
////                    //console.log('raw', e.raw);
////                    //if(e.raw === 'ul class="listContent" log-mod="list"') {
////                    if(e.raw === 'div class="info clear"') {
////                        house_list.push(e);
////                    } else if(e.children){
////                        get_data(e.children);
////                    }
////                }
////            }
////
////            get_data(handler.dom);
//        }
//    });
//}

function do_parse(html) {
    var handler = new htmlparser.DefaultHandler(function (error, dom) {
        if(error){

        } else {
            //console.log('dom:', dom);
        }
    });
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(html);
    //console.log(JSON.stringify(handler.dom, null, 2));
    console.log(handler.dom);
    //        for(let e of handler.dom[1].children[1].children) {
    //            if(e.raw == 'div class="content"') {
    //                console.log(e.children[1].children);
    //
    //                for(let e1 of (e.children[1].children)) {
    //                    if(e1.raw === 'ul class="listContent" log-mod="list"') {
    //                        console.log(JSON.stringify(e1.children[0].children[1].children[5].children, null ,2));
    //                    }
    //                }
    //            }
    //        }
    //console.log(handler.dom[1].children[1]);

    function get_data(children) {
        for(let e of children) {
            //console.log('raw', e.raw);
            //if(e.raw === 'ul class="listContent" log-mod="list"') {
            if(e.raw === 'div class="info clear"') {
                house_list.push(e);
            } else if(e.children){
                get_data(e.children);
            }
        }
    }

    get_data(handler.dom);
}
