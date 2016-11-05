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
        //console.log(html_list);

        for(let html of html_list) {
            do_parse_html(html);
        }

        console.log(JSON.stringify(house_list[0].children, null, 2));
        console.log(house_list.length);

        let house_object_list = [];
        for(let house of house_list) {
            house_object_list.push(
                do_parse_house(house)
            );
        }

        console.log(house_object_list);
    })
    .catch(
        (error) => {
            console.log(error);
            console.log('Failed!');
        }
    );

function do_parse_house(house) {
    let _house = {};
    for(let e of house.children) {
        if(e.attribs) {
            switch(e.attribs.class) {
            case 'title':
                _house.title = e.children[0].children[0].raw;
                break;

            case 'address':
                _house.address = e.children[0].children[1].children[0].raw
                    + e.children[0].children[2].raw;
                _house.area = _house.address.split(' | ')[2].replace(/平米/, '');
                break;

            case 'flood':
                _house.floor = e.children[0].children[1].raw
                    + e.children[0].children[2].children[0].raw;
                break;

            case 'followInfo':
                _house.follow_info = e.children[1].raw;
                break;

            case 'tag':
                //_house.tag = e.children[0].children[0].raw;
                break;

            case 'priceInfo':
                _house.price = {
                    total: e.children[0].children[0].children[0].raw,
                    unit: e.children[1].attribs['data-price']
                };
                break;
            }
        }
    }

    return _house;
}

function do_parse_html(html) {
    var handler = new htmlparser.DefaultHandler(function (error, dom) {
        if(error){

        } else {
            //console.log('dom:', dom);
        }
    });
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(html);

    //console.log(handler.dom);

    function get_data(children) {
        for(let e of children) {
            if(e.raw === 'div class="info clear"') {
                house_list.push(e);
            } else if(e.children){
                get_data(e.children);
            }
        }
    }

    get_data(handler.dom);
}
