$(function(){

    function refresh_details(section, name) {
        var template = $.ajax({url:"/static/templates/" + section + "_details.html", async: false}).responseText;
        var details = $.parseJSON($.ajax({url: "/project/" + name, dataType: "json", async: false}).responseText);
        var builds = $.parseJSON($.ajax({url: "/build/" + name, dataType: "json", async: false}).responseText);
        
        $("#" + section + "-" + name + "-details").html($.mustache(template, { builds: builds, details:details }));

        $("table[class*=tablesorter]").tablesorter()
        $("a[id='build-log-show']").click(function () {
                var build_id = $(this).attr("build_id");
                show_log(name, build_id);
                $.doTimeout('refresh-log', 2000, function () {
                    show_log(name, build_id);
                    return true;
                });
        });
    }

    function show_details(section, name) {
        refresh_details(section, name);
        $("#" + section + "-" + name + "-details").toggle("blind", function() {
            if($(this).css("display") == "none") {
                $.doTimeout("refresh-detail");
            }
        });

        $.doTimeout("refresh-detail", 10000, function(event, id) {
            refresh_details(section, name);
            return true;
        });
        
    }

    function show_log(name, build_id) {
        var build_log = $.ajax({url: "/log/" + name + "/" + build_id, dataType: "json", async: false}).responseText;
        $("#build-log-view").find("div.modal-body").html("<pre>" + build_log + "</pre>");
        $('#build-log-view').find("div.modal-body").attr("scrollTop", $('#build-log-view').find("div.modal-body").attr("scrollHeight"));
        if ($("#build-log-view").css("display") == "none") 
            $("#build-log-view").modal("show");


        $("a[id='refresh-button']").click(function() {
            show_log(name, build_id); 
        });
        $("#build-log-view").bind("hide", function () {
            $.doTimeout('refresh-log');
        });

    }

    function visit(section) {
        $.ajax({
            url:"/" + section,
            method: "GET",
            dataType: "json",
            success: function(data) {
                var template = $.ajax({url:"/static/templates/" + section + ".html", async: false}).responseText;
                $("#content").html($.mustache(template, { items : data.sort(function(a, b) { 
                    if (a['name'] < b['name']) {
                        return -1;
                    } else {
                        return 1;
                    } 
                    if (a['name'] == b['name']) 
                        return 0;
                }) } ));
                $("#create").click(function() {
                        $("div[id="+ section +"-form]").modal("show");
                });

                $("ul.nav").find("li").removeClass("active");
                $("li#" + section).addClass("active");

                switch(section) {
                    case 'group':
                            $(".edit").editInPlace({
                                callback : function(unused, enteredText) { 
                                    console.log($(this).attr("id") + " " + enteredText);
                                    $.ajax("/group/" + $(this).attr("group"), {
                                        type: "POST", 
                                        data: "edit=true&" + $(this).attr("id") + "=" + enteredText
                                    });
                                    return enteredText; 
                                }
                            });
                        break;

                    case 'project':
                        var groups_select = $.parseJSON($.ajax({url: "/group", dataType: "json", async: false}).responseText);
                        $("select#group_name").html("");
                        for(i=0, len=groups_select.length; i < len; i++) {
                            $("select#group_name").append("<option>" + groups_select[i].name + "</option>");
                        }

                        $("a[id^='show_']").each(function() {
                            $(this).click(function () { 
                                show_details('project', $(this).attr("id").split("_")[1]);
                            }); 
                        });

                        break;
                }

            } // sucess callback
        }); // ajax 

    }
   
    $('div[id*="-form"]').each(function() {
        /* init forms */
        var section = $(this).attr("id").split("-")[0];
        $(this).modal({"backdrop": true});

        $(this).find("#create-" + section + "-button").click(function() { 
                    var data = $("div[id=" + section + "-form]").find("form").serialize();
                    $.post("/"+ section, data, function() {
                        $("#" + section +"-form").find("input").each(
                            function () {
                                $(this).val("");
                            });
                        $("div[id="+ section +"-form]").dialog("close"); 
                        visit(section);
                    });
                });

        $(this).find("#cancel-" + section + "-button").click(function() { $(this).modal("hide"); });
    });
                
    /*
    $("#build-log-view").dialog({
        autoOpen: false,
        height: 400,
        width: 470,
        modal: true,
    });
    */

    $("#build-log-view").modal({'backdrop': true});
    
    $("ul.nav").find("li").each(function(){
        var menu_item = $(this);
        menu_item.click(function() {
            var menu_text = $(this);
            visit(menu_text.attr("id").toLowerCase()); 
        });
    });
    
    visit("project");
});