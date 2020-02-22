/*
  获取所需要的操作的元素
 */
var oFilesList = $(".content");
var oBtn = $("input[type='submit']");
var oContent = document.getElementById("content");
var number = window.location.hash.substring(1) || 1;
// 利用html5 FormData() API,创建一个接收文件的对象，因为可以多次拖拽，这里采用单例模式创建对象Dragfiles
// 立即执行
var Dragfiles = (function () {
    var instance;
    return function () {
        if(!instance){
            instance = new FormData();
        }
        return instance;
    }
}());
// 为Dragfiles添加一个清空所有文件的实例方法
//  instance,Dragfiles可调用此方法
FormData.prototype.deleteAll=function () {
    //保存this
    var oThis = this;
    this.forEach(function (value, key) {
        oThis.delete(key);
    });
};


/*
  创建方法
 */
//1.改变文件拖入框的边框颜色
function blink() {
    oContent.style.borderColor = "gray";
};

//2.请求某一页的数据
// xx.php?act=get&page=xx		获取一页数据
// 返回：[{id: ID, filesName: 文件名, filesSize：文件大小, filesTime: 文件上传时间}, {...}, ...]
function getFilesList(number){
    $.ajax({
        type:"get",
        url:"xx.php",
        data:"act=get&page="+number,
        success:function (msg) {
            //json转对象
            var obj = eval("("+msg+")");
            $.each(obj, function(key, value){
                // act=add&filesName="+files[i].name+"filesSize="+size+"&filesTime="+time
                var oTr=document.createElement('tr');
                var oTbody = document.getElementsByClassName("tbody");
                oTr.innerHTML='<td>'+value.filesName+'</td><td>'+value.filesTime+'</td><td>'+value.filesSize+'</td><td>删除</td>';
                oTbody.appendChild(oTr);
            });
        },
        error: function (xhr) {
            console.log("failed");
        }
    });
}

//3.获取页数
//xx.php?act=get_page_count	获取页数
// 返回：{count:页数}
function getPage(){
    //清空页码，避免出现重复
    $(".page").html("");
    $.ajax({
        type:"get",
        url:"xx.php",
        data:"act=get_page_count",
        success:function (msg) {
            var obj = eval("("+msg+")");
            for(var i = 0; i < obj.count; i++){
                //创建节点
                var $a = $("<a href=\"javascript:;\">"+(i+1)+"</a>");
                //判断是否为当前选中页码
                if(i === (number-1)){
                    $a.addClass("current");
                }
                //添加节点
                $(".page").append($a);
            }
        },
        error:function (xhr) {
            console.log("failed");
        }
    });
}

//4.上传文件
function upload(){
    //判断tbody中是否有节点
    var oTbody = document.getElementsByTagName("tbody")[0];
    if (oTbody.hasChildNodes() === false){
        oContent.style.borderColor = "red";
        //设置最大时间
        setTimeout(blink, 200);
        return false;
    }
    //获取formDate
    var data = Dragfiles();
    // 清空formData
    data.deleteAll();
    //清空表列
    $(".tbody").empty();
    $.ajax({
        type: "post",
        url: "xx.php",
        data: data,
        async: true,
        cache: false,
        contentType: false,
        processData: false,
        success: function (data) {
            console.log("succeed");
        },
        error: function (xhr) {
            console.log("failed");
        }
    });
};


getFilesList(number);
getPage();


/*
  事件监听
 */
//1.监听提交按钮的点击
oBtn.click(function check(){
    //检查是否有未填写项
    var res1 = $("#userName").val().length;
    var res2 = $("#userNum").val().length;
    var res3 = $("#workId").val().length;
    if(res1 === 0 || res2 === 0 || res3 === 0){
        alert("带星号项必填");
        //若带星号的未填写完整则不能提交表单数据
        return false;
    }
    //若填写完整则上传文件且执行默认提交时间
    upload();
    return true;
});


//2.监听删除事件
//使用事件委托来实现“删除”功能
$("body").delegate("tr td:last-child", "click", function () {
    // xx.php?act=del&id=12			删除一条数据
    // 返回：{error:0}
    var $this = $(this);
    var list = $this.parent("tr").get(0);
    $this.parents("tr").remove();
    $.ajax({
        type: "get",
        url: "xx.php",
        data: "act=del&id="+list.obj.id,
        success: function (data) {
            console.log("succeed");
        },
        error: function (xhr) {
            console.log("failed");
        }
    });
    //删除当前点击数据
    $this.parents("tr").remove();
    getPage();
    // 重新获取当前这一页数据
    getFilesList($(".current").html());
});


//3.监听"清空所有"按钮的点击(前面已绑定)
function clearAll(){
    var oTbody = document.getElementsByTagName("tbody")[0];
    if (oTbody.hasChildNodes() === false){
        oContent.style.borderColor = "red";
        setTimeout(blink,300);
        return false;
    }
    var data = Dragfiles();
    data.deleteAll();
    $(".tbody").empty();
    getPage();
    // xx.php?act=delAll			删除所有数据
    // 返回：{error:0}
    $.ajax({
        type: "get",
        url: "xx.php",
        data: "act=delAll",
        success: function (data) {
            console.log("succeed");
        },
        error: function (xhr) {
            console.log("failed");
        }
    })
}


// 4.监听页码点击
$("body").delegate(".page>a", "click", function () {
    //给点击的页码添加current类名
    $(this).addClass("current");
    //排他
    $(this).siblings().removeClass("current");
    //清空当前页面内容
    $(".tbody").html("");
    //获取点击页面的内容
    getFilesList($(this).html());
    // 保存当前点击的页码
    window.location.hash = $(this).html();
});


// 5.监听文件拖拽事件
oContent.ondragover = function (event) {
    // 阻止浏览器默认打开文件的操作
    // event = event || window.event;
    event.preventDefault();
    // 拖入文件后边框变红
    this.style.borderColor = "red";
};

oContent.ondragleave = function () {
    //恢复边框颜色
    blink();
};

oContent.ondrop = function (event) {
    //恢复边框颜色
    blink();
    //阻止浏览器默认打开文件的操作
    event = event || window.event;
    event.preventDefault();
    var files = event.dataTransfer.files;
    var len = files.length;
    var frag=document.createDocumentFragment();  // 为了减少js修改dom树的频度，先创建一个fragment，然后在fragment里操作
    var oTr, time, size;
    var newForm = Dragfiles();  // 获取单例
    for (var i = 0; i < len; i ++){
        oTr=document.createElement('tr');
        //获取文件大小
        size=Math.round(files[i].size * 100 / 1024) / 100 + 'KB';
        //获取格式化的修改时间           //2020/2/13                                          15:38:09 GMT+0800 (中国标准时间)     15:38:09
        time = files[i].lastModifiedDate.toLocaleDateString() + ' '+files[i].lastModifiedDate.toTimeString().split(' ')[0];
        //2020/2/13 15:38:09
        oTr.innerHTML='<td>'+files[i].name+'</td><td>'+time+'</td><td>'+size+'</td><td>删除</td>';
        //插入节点
        frag.appendChild(oTr);
        //添加文件到newForm
        newForm.append(files[i].name,files[i]);
        //插入节点
        frag.appendChild(oTr);
        //添加文件到newForm
        newForm.append(files[i].name,files[i]);
        //重新获取页码
        getPage();
        //删除最前面的一条
        if($("tr").length > 7){
            $("tr:last-child").remove();
        }
        // xx.php?act=add&filesName=xxx&filesSize=xxx&filesTime=xxx	添加一条
        // 返回：{error:0, id: 新添加内容的ID, filesTime: 添加时间}
        $.ajax({
            type: "get",
            url: "xx.php",
            data: "act=add&filesName="+files[i].name+"&filesSize="+size+"&filesTime="+time,
            async: true,
            cache: false,
            contentType: false,
            processData: false,
            success: function (msg) {
                console.log("succeed");
            },
            error: function (xhr) {
                console.log("failed");
            }
        });
    }
    this.childNodes[1].childNodes[1].appendChild(frag);
};
