package com.elegantevents.service;

import com.elegantevents.dto.WeddingCardRequest;
import com.elegantevents.model.Wedding;
import com.elegantevents.model.WeddingCard;
import com.elegantevents.repository.WeddingCardRepository;
import com.elegantevents.repository.WeddingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional
public class WeddingCardService {
    
    private final WeddingCardRepository weddingCardRepository;
    private final WeddingRepository weddingRepository;
    
    public WeddingCardService(WeddingCardRepository weddingCardRepository,
                             WeddingRepository weddingRepository) {
        this.weddingCardRepository = weddingCardRepository;
        this.weddingRepository = weddingRepository;
    }
    
    public WeddingCard createOrUpdateWeddingCard(String coupleClerkId, WeddingCardRequest request) {
        Wedding wedding = weddingRepository.findByClerkId(coupleClerkId)
                .orElseThrow(() -> new RuntimeException("Wedding not found"));
        
        Optional<WeddingCard> existingCard = weddingCardRepository.findByWeddingId(wedding.getId());
        
        WeddingCard card;
        if (existingCard.isPresent()) {
            card = existingCard.get();
        } else {
            card = new WeddingCard();
            card.setWeddingId(wedding.getId());
            card.setCoupleClerkId(coupleClerkId);
        }
        
        if (request.getTheme() != null) card.setTheme(request.getTheme());
        if (request.getCardDesign() != null) card.setCardDesign(request.getCardDesign());
        card.setDigitalCardEnabled(request.getDigitalCardEnabled() != null ? request.getDigitalCardEnabled() : true);
        if (request.getBackgroundImage() != null) card.setBackgroundImage(request.getBackgroundImage());
        if (request.getBackgroundVideo() != null) card.setBackgroundVideo(request.getBackgroundVideo());
        if (request.getCustomText() != null) card.setCustomText(request.getCustomText());
        if (request.getTextColor() != null) card.setTextColor(request.getTextColor());
        if (request.getBackgroundColor() != null) card.setBackgroundColor(request.getBackgroundColor());
        if (request.getAccentColor() != null) card.setAccentColor(request.getAccentColor());
        if (request.getFontSize() != null) card.setFontSize(request.getFontSize());
        if (request.getNameFontSize() != null) card.setNameFontSize(request.getNameFontSize());
        if (request.getFontFamily() != null) card.setFontFamily(request.getFontFamily());
        if (request.getTextAlign() != null) card.setTextAlign(request.getTextAlign());
        if (request.getOverlayOpacity() != null) card.setOverlayOpacity(request.getOverlayOpacity());
        if (request.getResizeMode() != null) card.setResizeMode(request.getResizeMode());
        if (request.getPlateType() != null) card.setPlateType(request.getPlateType());
        if (request.getPlateColor() != null) card.setPlateColor(request.getPlateColor());
        if (request.getBackgroundScale() != null) card.setBackgroundScale(request.getBackgroundScale());
        
        return weddingCardRepository.save(card);
    }
    
    @Transactional(readOnly = true)
    public WeddingCard getWeddingCardByCouple(String coupleClerkId) {
        return weddingCardRepository.findByCoupleClerkId(coupleClerkId)
                .orElseThrow(() -> new RuntimeException("Wedding card not found"));
    }
    
    @Transactional(readOnly = true)
    public WeddingCard getWeddingCardByWedding(Long weddingId) {
        return weddingCardRepository.findByWeddingId(weddingId)
                .orElseThrow(() -> new RuntimeException("Wedding card not found"));
    }
}

