package com.qiyu.application.system;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.application.system.dto.SystemModels.Menu;
import com.qiyu.domain.auth.*;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;

class SystemRouteRegistryTest {
    private AuthPrincipal principal(Set<String> permissions){
        return new AuthPrincipal(1,UserType.STAFF,null,null,Set.of(),permissions,DataScopeType.ALL_STORES,Set.of(),Set.of(),List.of(),Set.of(),"测试","");
    }
    private Menu menu(String id,String parent,String path,String type,boolean visible){
        return new Menu(id,parent,id,path,"*",type,0,visible,"ENABLED",0);
    }
    @Test void memberOnlyCanEnterCustomerCenter(){
        var rows=List.of(menu("1",null,"","DIRECTORY",true),menu("2","1","/customers","MENU",true));
        assertThat(SystemRouteRegistry.navigation(rows,principal(Set.of("member:read")))).hasSize(2);
    }
    @Test void unregisteredRouteAndForgedPermissionCannotGrantAccess(){
        var rows=List.of(menu("1",null,"/not-a-page","MENU",true),menu("2",null,"/reports","MENU",true));
        assertThat(SystemRouteRegistry.navigation(rows,principal(Set.of("booking:read")))).isEmpty();
    }
    @Test void hiddenAncestorHidesChildren(){
        var rows=List.of(menu("1",null,"","DIRECTORY",false),menu("2","1","/reports","MENU",true));
        assertThat(SystemRouteRegistry.navigation(rows,principal(Set.of("*")))).isEmpty();
    }
    @Test void cyclicAndOrphanedParentsFailClosed(){
        var rows=List.of(menu("1","2","","DIRECTORY",true),menu("2","1","","DIRECTORY",true),menu("3","2","/reports","MENU",true),menu("4","missing","/customers","MENU",true));
        assertThat(SystemRouteRegistry.navigation(rows,principal(Set.of("*")))).isEmpty();
    }
}
