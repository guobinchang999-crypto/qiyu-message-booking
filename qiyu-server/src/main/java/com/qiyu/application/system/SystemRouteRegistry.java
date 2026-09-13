package com.qiyu.application.system;

import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.application.system.dto.SystemModels.Menu;
import java.util.*;

/** Registered pages, not administrator input, define executable navigation targets. */
public final class SystemRouteRegistry {
    private SystemRouteRegistry() {}
    public static final Map<String,String> ROUTES=Map.ofEntries(
        Map.entry("/dashboard","dashboard:read"),Map.entry("/reports","report:read"),
        Map.entry("/reception","booking:read"),Map.entry("/appointments","booking:read"),
        Map.entry("/checkin","booking:checkin"),Map.entry("/service-orders","service_order:read"),
        Map.entry("/schedule","schedule:read"),Map.entry("/stores","store:read"),
        Map.entry("/therapists","therapist:read"),Map.entry("/services","service:read"),
        Map.entry("/rooms","room:read"),Map.entry("/customers","customer:read"),Map.entry("/coupons","coupon:read"),
        Map.entry("/system/organizations","system:org:manage"),Map.entry("/system/users","system:user:manage"),
        Map.entry("/system/roles","system:role:manage"),Map.entry("/system/menus","system:menu:manage"),
        Map.entry("/system/dictionaries","system:dict:manage"),Map.entry("/system/audit-logs","audit:read"));
    public static List<Menu> navigation(List<Menu> all,AuthPrincipal principal){
        Map<String,Menu> byId=new HashMap<>();all.forEach(m->byId.put(m.id(),m));Set<String> included=new HashSet<>();
        for(var row:all){
            String permission=ROUTES.get(row.path());
            if(!"MENU".equals(row.type())||permission==null||!(principal.hasPermission(permission)||("/customers".equals(row.path())&&principal.hasPermission("member:read"))))continue;
            Set<String> chain=new HashSet<>();Menu node=row;boolean valid=true;
            while(node!=null){
                if(!chain.add(node.id())||!node.visible()||!"ENABLED".equals(node.status())){valid=false;break;}
                if(node!=row&&!"DIRECTORY".equals(node.type())){valid=false;break;}
                String parent=node.parentId();node=parent==null||parent.equals("0")?null:byId.get(parent);
                if(parent!=null&&!parent.equals("0")&&node==null){valid=false;break;}
            }
            if(valid)included.addAll(chain);
        }
        return all.stream().filter(m->included.contains(m.id())).toList();
    }
}
