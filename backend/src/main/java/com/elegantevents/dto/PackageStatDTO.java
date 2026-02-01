package com.elegantevents.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PackageStatDTO {
    private String name;
    private long count;
    private double percentage;
    private String color;
}
