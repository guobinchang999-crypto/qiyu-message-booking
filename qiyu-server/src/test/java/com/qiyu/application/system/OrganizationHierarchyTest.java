package com.qiyu.application.system;

import com.qiyu.application.system.dto.SystemModels.*;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.*;

class OrganizationHierarchyTest {
    private final List<Organization> rows=List.of(
        new Organization("1",null,"总部","HEADQUARTERS","",0,"ENABLED",2),
        new Organization("2","1","门店","STORE","",0,"ENABLED",3),
        new Organization("3","2","接待","DEPARTMENT","",0,"ENABLED",0),
        new Organization("4","1","停用部门","DEPARTMENT","",0,"DISABLED",0));
    private OrganizationCommand move(String parent,long version){
        return new OrganizationCommand(parent,"门店","STORE","",0,"ENABLED",version);
    }
    @Test void rejectsSelfParent(){assertThatThrownBy(()->OrganizationHierarchy.validate(rows,"2",move("2",3))).hasMessageContaining("自身或下级");}
    @Test void rejectsDescendantParent(){assertThatThrownBy(()->OrganizationHierarchy.validate(rows,"2",move("3",3))).hasMessageContaining("自身或下级");}
    @Test void rejectsDisabledParent(){assertThatThrownBy(()->OrganizationHierarchy.validate(rows,"2",move("4",3))).hasMessageContaining("上级组织已停用");}
    @Test void rejectsStaleVersion(){assertThatThrownBy(()->OrganizationHierarchy.validate(rows,"2",move("1",2))).hasMessageContaining("已更新");}
    @Test void rejectsMissingParent(){assertThatThrownBy(()->OrganizationHierarchy.validate(rows,"2",move("missing",3))).hasMessageContaining("不存在");}
    @Test void rejectsDisablingParentOfEnabledChildren(){assertThatThrownBy(()->OrganizationHierarchy.validate(rows,"2",new OrganizationCommand("1","门店","STORE","",0,"DISABLED",3L))).hasMessageContaining("启用中的下级");}
    @Test void collectsAllDescendants(){assertThat(OrganizationHierarchy.descendants(rows,"1")).containsExactlyInAnyOrder("1","2","3","4");}
    @Test void acceptsValidMove(){assertThatCode(()->OrganizationHierarchy.validate(rows,"2",move(null,3))).doesNotThrowAnyException();}
}
