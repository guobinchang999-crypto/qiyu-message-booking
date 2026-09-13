package com.qiyu.infrastructure.system;

import com.qiyu.application.system.dto.SystemModels.DictionaryCommand;
import com.qiyu.infrastructure.persistence.mapper.SystemDictionaryProjection;
import com.qiyu.infrastructure.persistence.mapper.SystemManagementMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemDictionaryProtectionTest {
    @Mock SystemManagementMapper mapper;
    @InjectMocks SystemManagementRepository repository;

    private DictionaryCommand command(String type, String value, String status) {
        return new DictionaryCommand(type,"预约状态","已预约",value,20,status,"说明");
    }
    private void existing() {
        when(mapper.dictionaryForUpdate(1L)).thenReturn(new SystemDictionaryProjection(1L,"booking_status","预约状态","已预约","BOOKED",20,1,"说明"));
    }
    @Test void rejectsNewUnregisteredValues() {
        assertThatThrownBy(()->repository.saveDictionary(null,command("booking_status","NEW","ENABLED"),1L)).hasMessageContaining("不支持新增");
        verifyNoInteractions(mapper);
    }
    @Test void rejectsChangedValue() {
        existing();
        assertThatThrownBy(()->repository.saveDictionary(1L,command("booking_status","NEW","ENABLED"),1L)).hasMessageContaining("不可修改");
        verify(mapper,never()).updateDictionary(anyLong(),anyString(),anyString(),anyString(),anyInt(),anyInt(),anyString());
    }
    @Test void rejectsMovingItemToAnotherType() {
        existing();
        assertThatThrownBy(()->repository.saveDictionary(1L,command("room_status","BOOKED","ENABLED"),1L)).hasMessageContaining("不可修改");
    }
    @Test void rejectsDisablingProgramState() {
        existing();
        assertThatThrownBy(()->repository.saveDictionary(1L,command("booking_status","BOOKED","DISABLED"),1L)).hasMessageContaining("不支持启停");
    }
    @Test void rejectsDeletingProgramState() {
        when(mapper.dictionaryExists(1L)).thenReturn(1L);
        assertThatThrownBy(()->repository.deleteDictionary(1L,1L)).hasMessageContaining("不可删除");
        verify(mapper,never()).softDeleteDictionary(anyLong(),anyString());
    }
    @Test void displayEditDoesNotOverwriteSharedTypeMetadata() {
        existing();
        repository.saveDictionary(1L,command("booking_status","BOOKED","ENABLED"),1L);
        verify(mapper).updateDictionary(1L,"booking_status","已预约","BOOKED",1,20,"1");
        verify(mapper,never()).updateDictionaryType(anyString(),anyString(),anyString(),anyString());
    }
}
