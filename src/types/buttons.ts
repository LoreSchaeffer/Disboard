import {z} from "zod";
import {HEX_COLOR_PATTERN} from "../main/constants";

export const TimeUnitSchema = z.enum(['ms', 's', 'm']);
export const EndTimeTypeSchema = z.enum(['at', 'after']);

export const BtnStyleSchema = z.object({
    textColor: z.string().regex(HEX_COLOR_PATTERN, "Invalid Hex").optional(),
    textColorHover: z.string().regex(HEX_COLOR_PATTERN, "Invalid Hex").optional(),
    textColorActive: z.string().regex(HEX_COLOR_PATTERN, "Invalid Hex").optional(),
    backgroundColor: z.string().regex(HEX_COLOR_PATTERN, "Invalid Hex").optional(),
    backgroundColorHover: z.string().regex(HEX_COLOR_PATTERN, "Invalid Hex").optional(),
    backgroundColorActive: z.string().regex(HEX_COLOR_PATTERN, "Invalid Hex").optional(),
    borderColor: z.string().regex(HEX_COLOR_PATTERN, "Invalid Hex").optional(),
    borderColorHover: z.string().regex(HEX_COLOR_PATTERN, "Invalid Hex").optional(),
    borderColorActive: z.string().regex(HEX_COLOR_PATTERN, "Invalid Hex").optional(),
    autoPick: z.boolean().optional()
});

export const CropOptionsSchema = z.object({
    startTime: z.number().min(0).optional(),
    startTimeUnit: TimeUnitSchema.optional(),
    endTimeType: EndTimeTypeSchema.optional(),
    endTime: z.number().min(0).optional(),
    endTimeUnit: TimeUnitSchema.optional()
});

export const GridBtnSchema = z.object({
    id: z.uuid(),
    row: z.number().int().min(0).max(49),
    col: z.number().int().min(0).max(49),
    track: z.uuid(),
    title: z.string().optional(),
    volumeOverride: z.number().min(0).max(100).optional(),
    style: BtnStyleSchema.optional(),
    cropOptions: CropOptionsSchema.optional()
});

export const AmbientBtnSchema = z.object({
    id: z.string(),
    title: z.string(),
    volumeOverride: z.number().min(0).max(100).optional()
});

export type TimeUnit = z.infer<typeof TimeUnitSchema>;
export type EndTimeType = z.infer<typeof EndTimeTypeSchema>;
export type BtnStyle = z.infer<typeof BtnStyleSchema>;
export type CropOptions = z.infer<typeof CropOptionsSchema>;
export type GridBtn = z.infer<typeof GridBtnSchema>;
export type AmbientBtn = z.infer<typeof AmbientBtnSchema>;